import React, {useState, useEffect} from 'react'
import "./login.css"
import axios from "axios"


function Login() {

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [note, setNote] = useState("")
    const [loading, setLoading] = useState(false)

    const handleLogin = async () =>  {
        setLoading(true)
        setNote("")

        const response = await axios.post("http://localhost:5000/api/login", 
        {email: email, password: password})


        if(response.data.message === "Password Correct!") {
            setTimeout(() => {
                setNote("Signin was successful!")
            }, 500)
            
            localStorage.setItem("email", response.data.data.email)

            setTimeout(() => {
                window.location = "/"
            }, 1500)

        }
        else if(response.data.message === "No User Found!") {
            setTimeout(() => {
                setNote("No user found with that Email!")
            }, 500)
            
        }
        else if(response.data.message === "Password Incorrect!") {
            setTimeout(() => {
                setNote("Password is incorrect!")
            }, 500)
            
        }

        else if(response.data.message === "Some Error!") {
            setTimeout(() => {
                setNote("There was some error!")
            }, 500)
        }
        else {
            setTimeout(() => {
                setNote("Something went wrong!")
            }, 500)
            
        }

        setTimeout(() => {
            setLoading(false)
        }, 500)
        

    }

    const validation = () => {
        if(email === "" || password === "") {
            setNote("Please fill all the fields!")
        }
        else {
            handleLogin()
        }
    }

    useEffect(() => {
        document.title = "Chatty - Sign In"
    }, [])

    return (
        <div>
            <div className="header">
                <p>Chatty</p>
            </div>
            <div className="login">
                <h2>Sign In</h2>
                <input placeholder="Email" type="text" value={email} onChange={(e) => setEmail(e.target.value)} />
                <input placeholder="Password" type="text" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button onClick={validation}>
                    {loading ? <div className="login-spinner"></div> : "Sign In"}
                </button>
                <p>Don't have an account? <a href="/register">Register</a></p>          
            </div>
            {note &&
            <div className="note">
                <span className="note-msg">{note && note}</span>
            </div>
            }
        </div>
    )
}

export default Login
