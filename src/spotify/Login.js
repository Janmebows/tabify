import React, {useEffect} from 'react';

export default Login;

function Login() {
    useEffect(() => {
        fetch('/auth/login').then();
    }, []);
    return (
        <div className="App">
            <header className="App-header">
                <a className="btn-spotify" href="/auth/login" >
                    Login with Spotify
                </a>
            </header>
        </div>
    );
}

