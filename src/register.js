import React, {useState, useEffect} from 'react'
import "./register.css"
import axios from "axios"


function Register() {

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [url, setUrl] = useState("")

  const [loading, setLoading] = useState(false)
  const [note, setNote] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [inValidWords, setInValidWords] = useState([
    "fmail", "Fmail", "@fmail", "@Fmail", "chatty", "Chatty"])

  
  const handleSubmit = () => {
    if(name === "" || email === "" || password === "") {
        setNote("Name, email or password must not be empty!")
        setTimeout(() => {
          setNote("")
        }, 1500)
    }
    else {
      for(let i = 0; i < inValidWords.length; i++) {
        if(email.includes(inValidWords[i])) {
            setNote("Words like: 'Fmail', 'Chatty' or '@fmail' cannot be used!")
            break;
        }
        else {
          if(i === (inValidWords.length - 1)) {
              if(note === "") {
                  setLoading(true)
                  axios.post("http://localhost:5000/api/register", {
                    name: name, 
                    email: email + "@fmail.com", 
                    password: password,
                    display_pic: url
                  }).then((res) => {
                      if(res.data.message === "User Exists!") {
                        setTimeout(() => {
                          setLoading(false)
                          setNote("Email already in use!")
                        }, 1700)
                        setTimeout(() => {
                          setNote("")
                        }, 4000)
                      }
                      else if(res.data.message === "User Added!") {
                        console.log(res)
                        setTimeout(() => {
                          setNote("Signup was successful!")
                          setLoading(false)
                        }, 1500)
                        setTimeout(() => {
                          setNote("")
                          window.location = "/login"
                        }, 3100)
                      }
                      else if(res.data.message === "Some Error!") {
                        console.log(res)
                        setTimeout(() => {
                          setLoading(false)
                          setNote("There was some error!")
                        }, 1400)
                        setTimeout(() => {
                          setNote("")
                        }, 3500)
                      }
                      
                  }).catch((err) => {
                      setLoading(false)
                      setNote("There was some error!")
                      setTimeout(() => {
                        setNote("")
                      }, 3000)
                  })

              }
          }
        }
      }

    }
        

  }

  useEffect(() => {
    document.title = "Chatty - Sign Up"
  }, [])


  return (
    <div>
        <div className="header">
            <p>Chatty</p>
        </div>
        <div className='register'>
              <h2>Sign Up</h2>
              <input value={name} onChange={(e) => setName(e.target.value)}
              placeholder='Name' type="text" maxLength="30" />
              <div className='email-section'>
                <input value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder='Email' type="text" maxLength="255" />
                <span>@fmail.com</span>
              </div>
              
              <div className='password-section'>
                <input value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder='Password' type={showPassword ? "text" : "password"} maxLength="50"/>
                <i className='fas fa-eye' onClick={() => setShowPassword(!showPassword)}
                style={{"color": !showPassword ? "rgb(202, 202, 202" : "#98e4ee",
                "opacity": !showPassword ? 0.65 : 1}}>
                </i>
              </div>
              
              <input value={url} onChange={(e) => setUrl(e.target.value)}
              placeholder='Display Pic URL (optional)' type="text" />
              <button onClick={!loading ? handleSubmit : null}>
                {loading ? <div className="login-spinner"></div> :
                 "Sign Up"
                }
              </button>
        </div>
        {note &&
            <div className="note">
                <span className="note-msg">{note && note}</span>
            </div>
            }
    </div>
  )
}

export default Register