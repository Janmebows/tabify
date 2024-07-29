import React from 'react';
import ReactDOM from 'react-dom';
import AuthGuard from './spotify/AuthGuard';

ReactDOM.render(
  <React.StrictMode>
    <AuthGuard />
  </React.StrictMode>,
  document.getElementById('root')
);
