import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Waiver from './pages/Waiver';
import Passcode from './pages/Passcode';
import Rent from './pages/Rent';
import Account from './pages/Account';
import ReturnInstructions from './pages/ReturnInstructions';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Gateway from './pages/Gateway';
import StaffUnlock from './pages/StaffUnlock';
import StaffReturn from './pages/StaffReturn';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Resources from './pages/Resources';
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
        <Route path="/passcode" component={Passcode} />
        <Route path="/rent" component={Rent} />
        <Route path="/account" component={Account} />
        <Route path="/return" component={ReturnInstructions} />
        <Route path="/profile" component={Profile} />
        <Route path="/admin" component={Admin} />
        <Route path="/gateway" component={Gateway} />
        <Route path="/staff/unlock" component={StaffUnlock} />
        <Route path="/staff/return" component={StaffReturn} />
        <Route path="/resources" component={Resources} />
      </Switch>
    </Router>
  );
};

export default App;