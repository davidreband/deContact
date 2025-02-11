import { createLibp2p } from 'libp2p'
import { createHelia } from "helia";
import { OrbitDBAccessController, useAccessController} from '@orbitdb/core';
import { LevelBlockstore } from "blockstore-level"
import { LevelDatastore } from "datastore-level";
import { bitswap } from '@helia/block-brokers'
import { config } from "../../config.js";
import {
    libp2p,
    helia,
    orbitdb,
    masterSeed,
    seedPhrase,
    myAddressBook,
    dbMyAddressBook,
    subscription,
    connectedPeers,
    handle,
    progressText,
    progressState,
    subscriberList, dbMessages, selectedTab, recordsSynced, synced, syncedDevices,
} from "../../stores.js";

import AddressBookAccessController from "./AddressBookAccessController.js"
import { confirm } from "../components/modal.js"
import { convertTo32BitSeed, notify, sha256 } from "../../utils/utils.js";
import {getIdentityAndCreateOrbitDB} from "$lib/network/getIdendityAndCreateOrbitDB.js";

let blockstore = new LevelBlockstore("./helia-blocks")
let datastore = new LevelDatastore("./helia-data")

// export const CONTENT_TOPIC = "/dContact/3/message/proto";

const SEND_ADDRESS_REQUEST = 'SEND_ADDRESS_REQUEST';
const RECEIVE_ADDRESS = 'RECEIVE_ADDRESS';

async function getAddressRecords() {
    try {
        const addressRecords = await _dbMyAddressBook.all();
        const transformedRecords = addressRecords.map(record => ({
            ...record.value,
            id: record.value._id
        }));
        myAddressBook.set(transformedRecords);
        console.log("records in dbMyAddressBook ",addressRecords)
    } catch (e) {
        console.log("something isn't yet correctly setup inside dbMessages")
    }
}

async function getMessageRecords() {
    try {
        const msgRecords = await _dbMessages.all();
        const transformedRecords = msgRecords.map(record => ({
            ...record.value,
            id: record.value._id
        }));
        recordsSynced.set(transformedRecords)
        console.log("recordsSynced",transformedRecords)
    } catch (e) {
        console.log("something isn't yet correctly setup inside dbMessages")
    }
}

export async function startNetwork() {

    progressText.set("starting libp2p node")
    progressState.set(1)
    _libp2p =  await createLibp2p(config)
    libp2p.set(_libp2p)

    progressText.set("starting Helia (IPFS) node")
    progressState.set(2)
    _helia = await createHelia({
        libp2p: _libp2p,
        blockstore,
        datastore,
        blockBrokers: [bitswap()]
    });
    helia.set(_helia)
    window.helia = _helia

    progressText.set("creating Identity and starting OrbitDB")
    const identitySeed = convertTo32BitSeed(_masterSeed)
    _orbitdb = await getIdentityAndCreateOrbitDB('ed25519',identitySeed,_helia)
    orbitdb.set(_orbitdb)
    progressState.set(3)

    progressText.set("subscribing to pub sub topic")
    // _libp2p.services.pubsub.subscribe(CONTENT_TOPIC)
    progressState.set(4)

    _libp2p.addEventListener('connection:open',  async (c) => {
        console.log("connection:open",c.detail.remoteAddr.toString())
        connectedPeers.update(n => n + 1);

        if(_connectedPeers>1) {
                await getAddressRecords();
                progressState.set(6)
        }
    });

    _libp2p.addEventListener('connection:close', (c) => {
        console.log("connection:close",c.detail.id)
        connectedPeers.update(n => n - 1);
    });
    progressText.set(`opening peer-to-peer storage protocol`)

    /**
     * My Address Book (with own contact data and contact data of others
     */
    useAccessController(OrbitDBAccessController)
    const myDBName = await sha256(_orbitdb.identity.id)
    _dbMyAddressBook = await _orbitdb.open("/myAddressBook/"+myDBName, {
        type: 'documents',
        sync: true,
        identities: _orbitdb.identities,
        identity: _orbitdb.identity,
        AccessController: OrbitDBAccessController({ write: [_orbitdb.identity.id]})
    })
    window.dbMyAddressBook = _dbMyAddressBook
    await getAddressRecords()
    _dbMyAddressBook.events.on('join', async (peerId, heads) => {
        console.log("one of my devices joined and synced myaddressbook",peerId)
        syncedDevices.set(true)
        getAddressRecords()
    })

    _dbMyAddressBook.events.on('update', async (entry) => {
        getAddressRecords()
    })

    /*
     * Storage Protocoll
     */
    useAccessController(AddressBookAccessController)
    _dbMessages = await _orbitdb.open("dbMessages", {
        type: 'documents',
        sync: true,
        identities: _orbitdb.identities,
        identity: _orbitdb.identity,
        AccessController: AddressBookAccessController(_orbitdb, _orbitdb.identities, _subscriberList) //this should be almost same as OrbitDBAccessController but should use id's if me and all ids I am following (as soon as Alice receives Bobs contact data, his data will be added to the log) (this happens in the moment alice allows it by buton click)
    })
    dbMessages.set(_dbMessages)
    window.dbMessages = _dbMessages
    await getMessageRecords()

    console.log("_dbMyAddressBook",_dbMyAddressBook)
    dbMyAddressBook.set(_dbMyAddressBook)
    window.dbMyAddresses = _dbMyAddressBook
    _dbMessages.events.on('join', async (peerId, heads) => {
        console.log("join storage protocol",peerId)
        synced.set(true)
        await getMessageRecords()
    })

    _dbMessages.events.on('update', async (entry) => {
        console.log("update",entry)
        const OP = entry.payload.op
        if(OP==="PUT"){ //we only handle PUT messages (no DEL) //TODO this should go into AccessController
            const message = entry.payload.value
            console.log("processing message of storage protocol via orbitdb",message)
            handleMessage(message)
        }
        // Full replication is achieved by explicitly retrieving all records from db1.
        const records = await _dbMessages.all()
        recordsSynced.set(records)
    })
    progressState.set(5)
}
async function handleMessage (messageObj) {
    if (!messageObj) return;
    if (messageObj.recipient === messageObj.sender) return;

    let result;
    if (messageObj.recipient === _orbitdb?.identity?.id){
        switch (messageObj.command) {
            case SEND_ADDRESS_REQUEST: //we received a SEND_ADDRESS_REQUEST and sending our address
                result = await confirm({data:messageObj})
                if(result){
                    const contact = _myAddressBook.find((entry) => entry.owner === _orbitdb?.identity?.id)
                    sendMyAddress(messageObj.sender,contact);
                    if(_subscriberList.indexOf(messageObj.sender)===-1)
                        _subscriberList.push(messageObj.sender)
                    console.log("_subscriberList",_subscriberList)
                    subscriberList.set(_subscriberList) //keep subscribers
                }
            break;
            case RECEIVE_ADDRESS: //we received an address and add it to our address book //TODO show address sender in modal
                result = await confirm({data:messageObj})
                if(result) {
                    updateAddressBook(messageObj);
                }
            break;
            default:
                console.error(`Unknown command: ${messageObj.command}`);
        }
    }
}

async function createMessage(command, recipient, data = null) {
    const message = {
        timestamp: Date.now(),
        command,
        sender: _orbitdb?.identity?.id,
        recipient,
        data: data ? JSON.stringify(data) : null,
    };
    message._id = await sha256(JSON.stringify(message));
    // message.publicKey = _ourIdentity.publicKey;
    return message;
}

export const sendAddress = async (scannedAddress) => {
    try {
        console.log("request sendAddress from", _orbitdb?.identity?.id);
        const addr = await createMessage(SEND_ADDRESS_REQUEST, scannedAddress);
        const hash = await _dbMessages.put(addr);
        notify(`sent SEND_ADDRESS_REQUEST ${hash}`);
    } catch (error) {
        console.error('Error in sendAddress:', error);
    }
}

export async function sendMyAddress(recipient, data) {
    try {
        const myAddress = await createMessage(RECEIVE_ADDRESS, recipient, data);
        const hash = await _dbMessages.put(myAddress);
        notify(`sent RECEIVE_NEW_ADDRESS ${hash}`);
    } catch (error) {
        console.error('Error in sendMyAddress:', error);
    }
}

async function updateAddressBook(messageObj) {
    const contactData = JSON.parse(messageObj.data);
    const hash = _dbMyAddressBook.put(contactData)
    await getAddressRecords()
    notify(`address updated to local ipfs${hash}`)
}

let _libp2p;
libp2p.subscribe((val) => {
    _libp2p = val
});

let _helia;
helia.subscribe((val) => {
    _helia = val
});

let _orbitdb;
orbitdb.subscribe((val) => {
    _orbitdb = val
});

let _dbMessages;
dbMessages.subscribe((val) => {
    _dbMessages = val
});

let _dbMyAddressBook;
dbMyAddressBook.subscribe((val) => {
    _dbMyAddressBook = val
});

let _masterSeed;
masterSeed.subscribe((val) => {
    _masterSeed = val
});

let _seedPhrase;
seedPhrase.subscribe((val) => {
    _seedPhrase = val
});

let _subscription
subscription.subscribe((val) => {
    _subscription = val
});

let _handle
handle.subscribe((val) => {
    _handle = val
});
let _connectedPeers
connectedPeers.subscribe((val) => {
    _connectedPeers = val
});
let _myAddressBook
myAddressBook.subscribe((val) => {
    _myAddressBook = val
});

let _subscriberList
subscriberList.subscribe((val) => {
    _subscriberList = val
});

let _selectedTab
selectedTab.subscribe((val) => {
    _selectedTab = val
});