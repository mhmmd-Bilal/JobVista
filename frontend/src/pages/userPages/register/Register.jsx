import { React, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";

import {
  MDBBtn,
  MDBCard,
  MDBCardBody,
  MDBCardFooter,
  MDBIcon,
  MDBInput,
  MDBValidation,
  MDBValidationItem,
} from "mdb-react-ui-kit";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";

import {
  useRegisterMutation,
  useVerifyregisterationMutation,
  useGetIndustryTypesMutation,
  useGoogleRegisterMutation,
} from "../../../redux/userSlices/userApiSlice";

import "mdb-react-ui-kit/dist/css/mdb.min.css";
import logo from "../../../assets/JobVista.png"; // Import the image
import "./Register.css";
import countrydata from "../../../Utils/Countries";
import highestEducation from "../../../Utils/Educations";

import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { setCredentials } from "../../../redux/userSlices/userAuthSlice";

const Register = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobile, setMobile] = useState("");
  const [title, setTitle] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [visible, setVisible] = useState(false);
  const { userData } = useSelector((state) => state.auth);
  const [location, setLocation] = useState(null);
  const [gender, Setgender] = useState(null);
  const [industry, setIndustry] = useState(null);
  const [education, setEducation] = useState(null);
  const [industries, setIndustries] = useState([]);

  const [countries, setCountries] = useState([]);
  const [highestEducations, setHighestEducations] = useState([]);

  const [timer, setTimer] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const [register] = useRegisterMutation();
  const [verify] = useVerifyregisterationMutation();
  const [getIndustryTypes] = useGetIndustryTypesMutation();
  const [googleRegister] = useGoogleRegisterMutation();

  const fetchIndustries = async () => {
    try {
      const response = await getIndustryTypes();
      setIndustries(response.data.data);
    } catch (error) {
      toast.error(error?.data?.message || error?.message);
    }
  };

  useEffect(() => {
    setCountries(countrydata);
    setHighestEducations(highestEducation);
    fetchIndustries();
  }, []);
  useEffect(() => {
    if (userData) {
      navigate("/");
    }
  }, [navigate, userData]);

  const submitHandler = async (e) => {
    e.preventDefault();

    const mobileRegex = /^\d{10}$/;

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    try {
      if (!mobileRegex.test(mobile)) {
        toast.error("Invalid mobile number. Please enter a 10-digit number");
      } else if (password !== confirmPassword) {
        toast.error("Passwords do not match");
      } else if (!passwordRegex.test(password)) {
        toast.error(
          "Password should have 8 characters,digit,one special character,uppercase and lowercase"
        );
      } else {
        const res = await register({
          mobile,
          email,
        }).unwrap();
        if (res) {
          setVisible(true);
          setTimer(60);
          startTimer();
        }
      }
    } catch (err) {
      if (err.data && err.data.message) {
        toast.error(err.data.message);
      } else {
        toast.error("An error occurred. Please try again."); // Generic error message
      }
    }
  };

  const resendOtp = async () => {
    try {
      const res = await register({
        mobile,
        email,
      }).unwrap();
      if (res) {
        setVisible(true);
        setTimer(60);
        startTimer();
      }
    } catch (error) {
      console.log(error?.data?.message || error?.message);
    }
  };

  const otpHandler = async () => {
    try {
      const responseFromApiCall = await verify({
        firstName,
        lastName,
        mobile,
        email,
        gender,
        industry,
        location,
        education,
        title,
        password,
        otp,
      }).unwrap();
      if (responseFromApiCall) {
        toast.success("registration sucessfull");
        navigate(`/jobPreference/${responseFromApiCall._id}`);
      }
    } catch (error) {
      toast.error(
        error.data?.message || "An error occurred. Please try again."
      );
    }
  };

  const genderOptions = [
    { name: "Male" },
    { name: "Female" },
    { name: "Other" },
  ];

  const selectedCountryTemplate = (option, props) => {
    if (option) {
      return (
        <div className="flex align-items-center">
          <div>{option.name}</div>
        </div>
      );
    }

    return <span>{props.placeholder}</span>;
  };

  const countryOptionTemplate = (option) => {
    return (
      <div className="flex align-items-center">
        <div>{option.name}</div>
      </div>
    );
  };

  const selectedIndustryTemplate = (option, props) => {
    if (option) {
      return (
        <div className="flex align-items-center">
          <div>{option.industryName}</div>
        </div>
      );
    }

    return <span>{props.placeholder}</span>;
  };

  const IndustryOptionTemplate = (option) => {
    return (
      <div className="flex align-items-center">
        <div>{option.industryName}</div>
      </div>
    );
  };

  const startTimer = () => {
    setIsTimerRunning(true);
  };

  useEffect(() => {
    let interval;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer((prevTimer) => (prevTimer > 0 ? prevTimer - 1 : 0));
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  useEffect(() => {
    if (timer === 0) {
      setIsTimerRunning(false);
    }
  }, [timer]);

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
      if (res?.status) {
        navigate(`/addDetails/${res._id}`);
      } else {
        dispatch(setCredentials({ ...res }));
        navigate("/");
      }
    } catch (err) {
      console.error("Error downloading image:", err);
    }
  };

  const isMobile = window.innerWidth <= 767;

  return (
    <div>
      <div style={{ display: "flex" }} className="character">
        {/* Left Side (Form and Logo) */}
        <div style={{ flex: 1, marginTop: "25px" }}>
          <div style={{ maxWidth: "600px", margin: "auto" }}>
            {/* Your logo */}

            <MDBCard alignment="center" className="mb-5">
              <div className="mt-3">
                <img
                  src={logo}
                  alt="Logo"
                  style={{ width: "225px", height: "150px" }}
                />
              </div>
              <h2>Sign Up</h2>
              <MDBCardBody>
                <MDBValidation
                  onSubmit={submitHandler}
                  noValidate
                  className="row g-3"
                  encType="multipart/form-data"
                >
                  <div className="col-md-6">
                    <MDBInput
                      label="First Name"
                      type="text"
                      name="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      validation="Please provide your first name"
                    />
                  </div>
                  <div className="col-md-6">
                    <MDBInput
                      label="Last Name"
                      type="text"
                      name="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      validation="Please provide your last name"
                      invalid
                    />
                  </div>

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
                    />
                  </div>
                  <div className="col-md-6">
                    <MDBValidationItem className="col-md-12">
                      <MDBInput
                        label="Mobile"
                        type="tel"
                        name="mobile"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        required
                        validation="Please provide your mobile number"
                        invalid
                      />
                    </MDBValidationItem>
                  </div>
                  <div className="col-md-6">
                    <MDBInput
                      label="title"
                      type="text"
                      name="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <Dropdown
                      value={location}
                      onChange={(e) => setLocation(e.value)}
                      options={countries}
                      optionLabel="name"
                      placeholder="Select a Country"
                      filter
                      valueTemplate={selectedCountryTemplate}
                      itemTemplate={countryOptionTemplate}
                      className="w-100"
                    />
                  </div>
                  <div className="col-md-6">
                    <Dropdown
                      value={industry}
                      onChange={(e) => setIndustry(e.value)}
                      options={industries}
                      optionLabel="name"
                      placeholder="Select industry Type"
                      filter
                      valueTemplate={selectedIndustryTemplate}
                      itemTemplate={IndustryOptionTemplate}
                      className="w-100"
                    />
                  </div>
                  <div className="col-md-6">
                    <Dropdown
                      value={gender}
                      onChange={(e) => Setgender(e.value)}
                      options={genderOptions}
                      optionLabel="name"
                      placeholder="Select gender"
                      filter
                      valueTemplate={selectedCountryTemplate}
                      itemTemplate={countryOptionTemplate}
                      className="w-100"
                    />
                  </div>
                  <div className="col-md-6">
                    <Dropdown
                      value={education}
                      onChange={(e) => setEducation(e.value)}
                      options={highestEducations}
                      optionLabel="name"
                      placeholder="Select Highest Education"
                      filter
                      valueTemplate={selectedCountryTemplate}
                      itemTemplate={countryOptionTemplate}
                      className="w-100"
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
                    />
                  </div>
                  <div className="col-md-12">
                    <MDBInput
                      label="Confirm Password"
                      type="password"
                      name="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-12">
                    <MDBBtn
                      style={{
                        width: "100%",
                        borderRadius: "50px",
                        backgroundColor: "#387F8E",
                        color: "white",
                      }}
                      className="mt-2"
                    >
                      Sign Up
                    </MDBBtn>
                  </div>
                </MDBValidation>
              </MDBCardBody>
              <p style={{ textAlign: "center" }}></p>
              <MDBCardFooter className="mb-2">
                <Link to="/login">
                  <p style={{ color: "black" }}>
                    Already registered?
                    <span style={{ color: "#387F8E" }}> Sign in </span>
                  </p>
                </Link>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <GoogleOAuthProvider clientId="267836602539-diu2nc04smfqjj4q28ip8ts2v8n9bv88.apps.googleusercontent.com">
                    <GoogleLogin
                      onSuccess={(credentialResponse) => {
                        const decoded = jwtDecode(
                          credentialResponse.credential
                        );
                        googelAuth(decoded);
                      }}
                      onError={() => {
                        toast.error("failed to verify");
                        console.log("Login Failed");
                      }}
                    />
                  </GoogleOAuthProvider>
                </div>
              </MDBCardFooter>
            </MDBCard>
          </div>
        </div>

        <div className="card flex justify-content-center">
          <Dialog
            header="Verify OTP"
            visible={visible}
            style={isMobile ? { width: "100%" } : { width: "50vw" }}
            onHide={() => setVisible(false)}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ flex: 1, maxWidth: "450px", margin: "0 15px" }}>
                <MDBCard alignment="center" className="mb-5">
                  <MDBIcon fas icon="user-circle" className="fa-3x " />

                  <MDBCardBody>
                    <MDBValidation
                      noValidate
                      className="row g-3"
                      onSubmit={otpHandler}
                    >
                      <div className="col-md-12">
                        <MDBInput
                          label=" OTP"
                          type="password"
                          name="password"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-12">
                        <MDBBtn
                          style={{
                            width: "100%",
                            borderRadius: "50px",
                            backgroundColor: "#387F8E",
                            color: "white",
                          }}
                          className="mt-2"
                        >
                          Verify OTP
                        </MDBBtn>
                      </div>
                      <div className="col-12">
                        <Link
                          onClick={resendOtp}
                          className="mt-2"
                          disabled={isTimerRunning}
                          style={{
                            pointerEvents: isTimerRunning ? "none" : "auto",
                            color: isTimerRunning ? "gray" : "inherit",
                          }}
                        >
                          Resend OTP {isTimerRunning && `(${timer}s)`}
                        </Link>
                      </div>
                    </MDBValidation>
                  </MDBCardBody>
                  <p style={{ textAlign: "center" }}></p>
                  <MDBCardFooter className="mb-2"></MDBCardFooter>
                </MDBCard>
              </div>
            </div>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default Register;
