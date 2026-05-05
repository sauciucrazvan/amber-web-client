import { useEffect } from "react";
import { Route, type RouteProps } from "wouter";
import { useLocation } from "wouter";
import { useAuth } from "@/auth/AuthContext";

type RouteComponentProps = React.ComponentProps<
  NonNullable<RouteProps["component"]>
>;

type ProtectedRouteProps = Omit<RouteProps, "component"> & {
  component: React.ComponentType<RouteComponentProps>;
};

export default function ProtectedRoute({
  component: Component,
  ...rest
}: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) setLocation("/login");
  }, [isAuthenticated, setLocation]);

  return (
    <Route
      {...rest}
      component={(props) => (isAuthenticated ? <Component {...props} /> : null)}
    />
  );
}
