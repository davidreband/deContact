import {notify, sha256} from "./utils/utils.js";

import {
    myAddressBook,
    selectedAddr,
    selectedTab,
    qrCodeData,
    qrCodeOpen,
    orbitdb,
    myDal,
    dbMyAddressBook,
    handle,
    subscriberList
} from "./stores.js";
import {sendMyAddress} from "./lib/network/p2p-operations.js";

let _handle
handle.subscribe((value) => {
    _handle = value
})
let _orbitdb
orbitdb.subscribe((value) => {
    _orbitdb = value
})

let _selectedTab;
selectedTab.subscribe((value) => {
    _selectedTab = value
})

let _selectedAddr;
selectedAddr.subscribe((value) => {
    _selectedAddr = value
})

let _myAddressBook;
myAddressBook.subscribe((value) => {
    _myAddressBook = value
})

let _myDal;
myDal.subscribe((value) => {
    _myDal = value
})

let _dbMyAddressBook;
dbMyAddressBook.subscribe((value) => {
    _dbMyAddressBook = value
})

let _qrCodeData;
qrCodeData.subscribe((value) => {
    _qrCodeData = value
})

let _qrCodeOpen;
qrCodeOpen.subscribe((value) => {
    _qrCodeOpen = value
})

let _subscriberList
subscriberList.subscribe((val) => {
    _subscriberList = val
});

/**
 * Loading a contact from memory into the contactForm
 * @param id
 * @returns {Promise<void>}
 */
export async function loadContact(id) {
    console.log("loading")
    if (!myAddressBook || !_myAddressBook) return;
    const address = _myAddressBook.find(obj => obj.id === id) //|| await _myAddressBook.get(hash) || {}
    _selectedAddr = address
    if(!address) return //do not set undefined here
    selectedAddr.set(_selectedAddr)
    selectedTab.set(1)
    console.log("loading contact",id)
}

export async function addContact() {
    _selectedAddr.owner = _orbitdb?.identity?.id
    _selectedAddr._id = await sha256(JSON.stringify(_selectedAddr)) //TODO this hash is staying so far until the end of life
    const hash = _dbMyAddressBook.put(_selectedAddr)
    selectedAddr.set({})
    selectedTab.set(0)
    notify(`Contact added successfully to ipfs/orbitdb! ${hash}`);
}

export async function updateContact() {
    console.log("updating contact",_selectedAddr)
    const newAddrBook = _myAddressBook.filter( el => el._id !== _selectedAddr._id )
    _selectedAddr.owner = _orbitdb?.identity?.id
    await _dbMyAddressBook.put(_selectedAddr)
    console.log("updated contact in orbitdb")
    newAddrBook.push(_selectedAddr)
    myAddressBook.set(newAddrBook)
    notify(`Contact added successfully - informing subscribers! ${_myAddressBook.firstName} ${_myAddressBook.lastName}`)
    console.log("_subscriberList",_subscriberList)
    if(_selectedAddr.owner === _orbitdb?.identity?.id){ //only send update requests if my own address was changed
        for (const s in  _subscriberList) {
            sendMyAddress(_subscriberList[s],_selectedAddr)
        }
    }
    selectedAddr.set({})
    selectedTab.set(0)
}

export async function deleteContact() {
    myAddressBook.set(_myAddressBook.filter( el => el.id !== _selectedAddr.id ))
    notify(`Contact deleted successfully! ${_selectedAddr.firstName} ${_selectedAddr.lastName}`)
    selectedAddr.set({})
    selectedTab.set(0)
}

export async function generateQRForAddress(contact) {
    qrCodeData.set(contact)
    qrCodeOpen.set(true)
}