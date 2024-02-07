
import  ghpages  from 'gh-pages';
ghpages.publish(
    'build',
    {
        branch: 'gh-pages',
        silent: true,
        //repo: 'https://' + process.env.GITHUB_TOKEN + '@github.com/davidreband/deContact.git',
        repo:'git@github.com:davidreband/deContact.git',
        
        
        user: {
            name: 'David Reband',
            email: 'david.reband@gmail.com'
        }
    },
    () => {
        console.log('Deploy Complete!')
    }
)