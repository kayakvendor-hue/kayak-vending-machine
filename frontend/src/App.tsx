import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Waiver from './pages/Waiver';
import Rent from './pages/Rent';
import Passcode from './pages/Passcode';
import Account from './pages/Account';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Navbar from './components/Navbar';

const App: React.FC = () => {
  return (
    <Router>
      <Navbar />
      <Switch>
        <Route exact path="/" component={Home} />
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password/:token" component={ResetPassword} />
        <Route path="/waiver" component={Waiver} />
        <Route path="/rent" component={Rent} />
        <Route path="/passcode" component={Passcode} />
        <Route path="/account" component={Account} />
        <Route path="/profile" component={Profile} />
        <Route path="/admin" component={Admin} />
      </Switch>
    </Router>
  );
};

export default App;