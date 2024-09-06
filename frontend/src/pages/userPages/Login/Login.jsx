import React, { useEffect, useState } from "react";
import {
  MDBBtn,
  MDBContainer,
  MDBRow,
  MDBCol,
  MDBInput,
  MDBValidation,
} from "mdb-react-ui-kit";
import "mdb-react-ui-kit/dist/css/mdb.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import loginBg from "../../../assets/login-bg.png"; // Import the image
import logo from "../../../assets/JobVista.png"; // Import the image
import "./Login.css";
import { Link, useNavigate } from "react-router-dom";
import {
  useLoginMutation,
  useGoogleRegisterMutation,
} from "../../../redux/userSlices/userApiSlice";
import { setCredentials } from "../../../redux/userSlices/userAuthSlice";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";

import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.auth);

  const [googleRegister] = useGoogleRegisterMutation();
  const [login] = useLoginMutation();

  useEffect(() => {
    if (userData) {
      navigate("/");
    }
  }, []);

  const submitHandler = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Both email and password are required.");
    } else {
      try {
        const responseFromApiCall = await login({ email, password }).unwrap();
        console.log(responseFromApiCall);
        if (responseFromApiCall) {
          dispatch(setCredentials({ ...responseFromApiCall }));
          toast.success("Login Successful");
          navigate("/");
        } else {
          console.log(responseFromApiCall);
          toast.error("You are blocked by admin");
        }
      } catch (err) {
        toast.error(
          err.data?.message || "An error occurred. Please try again."
        );
      }
    }
  };

  const googelAuth = async (data) => {
    try {
      const {
        email,
        family_name: lastName,
        given_name: firstName,
        picture: profileImageURL,
      } = data;

      const imageResponse = await fetch(profileImageURL);
      const imageBlob = await imageResponse.blob();
      const profileImageFile = new File([imageBlob], "profile.jpg", {
        type: "image/jpeg",
      });

      const formData = new FormData();
      formData.append("firstName", firstName);
      formData.append("lastName", lastName);
      formData.append("email", email);
      formData.append("profileImg", profileImageFile);

      const res = await googleRegister(formData).unwrap();
      if (res.status) {
        dispatch(setCredentials({ ...res }));
        navigate("/");
      } else {
        toast.error("you are blocked by admin");
      }
    } catch (err) {
      console.error("Error downloading image:", err);
    }
  };

  return (
    <>
      <MDBContainer fluid>
        <MDBRow>
          <MDBCol sm="6">
            <div className="d-flex flex-column justify-content-center h-custom-2 w-75 mt-l-0 mt-3">
              <div className="d-flex flex-row ps-l-5 ps-0 align-items-center justify-content-center">
                <span className="h1 fw-bold mb-3">
                  <img
                    src={logo}
                    style={{ width: "150px", height: "100px" }}
                  ></img>
                </span>
              </div>
              <MDBValidation
                onSubmit={submitHandler}
                noValidate
                className="row g-1"
              >
                <div className="col-md-12">
                  <MDBInput
                    label="Email"
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    validation="Please provide your email"
                    invalid
                    wrapperClass="mb-4 mx-l-5 mx-0 w-100"
                  />
                </div>
                <div className="col-md-12">
                  <MDBInput
                    label="Password"
                    type="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    wrapperClass="mb-4 mx-l-5 mx-0 w-100"
                  />
                </div>
                <MDBBtn
                  className="mb-4 px-5 mx-l-5 mx-0 w-100"
                  color="info"
                  size="lg"
                  style={{ color: "white" }}
                >
                  Login
                </MDBBtn>
              </MDBValidation>
              <p className="small mb-2 pb-lg-3 ms-l-5 ms-0">
                <Link className="text-muted" to="/forgotPassword">
                  Forgot password?
                </Link>
              </p>
              <Link to="/signup">
                <p className="ms-l-5 ms-0">
                  Don't have an account?{" "}
                  <span className="link-info">Register here</span>
                </p>
              </Link>
              <div>
                <GoogleOAuthProvider clientId="267836602539-diu2nc04smfqjj4q28ip8ts2v8n9bv88.apps.googleusercontent.com">
                  <GoogleLogin
                    onSuccess={(credentialResponse) => {
                      const decoded = jwtDecode(credentialResponse.credential);
                      googelAuth(decoded);
                    }}
                    onError={() => {
                      toast.error("failed to verify");
                      console.log("Login Failed");
                    }}
                  />
                </GoogleOAuthProvider>
              </div>
              <Link to="/recruiterRegister">
                <p className="ms-l-5 ms-0">
                  Are you a recruiter?{" "}
                  <span className="link-info">Register here</span>
                </p>
              </Link>
            </div>
          </MDBCol>

          <MDBCol sm="6" className="d-none d-sm-block px-0">
            <img
              src={loginBg}
              alt="Login image"
              className="w-100"
              style={{ objectFit: "cover", objectPosition: "left" }}
            />
          </MDBCol>
        </MDBRow>
      </MDBContainer>
    </>
  );
}

export default Login;
