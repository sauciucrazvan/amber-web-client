import { Route, Router, Switch } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { Suspense, lazy } from "react";

import ProtectedRoute from "@/auth/ProtectedRoute";
import Loading from "./Loading";

const Homepage = lazy(() => import("./home/Homepage"));
const InProgressCallView = lazy(
  () => import("./home/calls/views/InProgressCallView"),
);
const RegisterView = lazy(() => import("./auth/Register"));
const LoginView = lazy(() => import("./auth/Login"));

export default function Tree() {
  return (
    <Router hook={useHashLocation}>
      <Suspense fallback={<Loading />}>
        <InProgressCallView />
        <Switch>
          <ProtectedRoute path="/call" component={Homepage} />
          <ProtectedRoute path="/" component={Homepage} />

          <Route path="/register" component={RegisterView} />
          <Route path="/login" component={LoginView} />
        </Switch>
      </Suspense>
    </Router>
  );
}
