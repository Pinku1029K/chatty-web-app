import React, {useState, useEffect, useLayoutEffect} from 'react'
import "./chats.css"
import io from "socket.io-client"
import axios from 'axios'
require("dotenv").config()

const socket = io.connect("http://localhost:5000")

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

const mic = new SpeechRecognition()
mic.continuous = true
mic.interimResults = true
mic.lang = "en-US"


function Chats() {

  const blank = "https://www.theparentingplace.net/wp-content/uploads/2021/02/BlankImage.jpg"
  const today = new Date()

  const [isListening, setIsListening] = useState(false)
  const [note, setNote] = useState(null)

  const handleListen = () => {
    if(isListening) {
      mic.start()
      mic.onend = () => {
        console.log("Continue")
        mic.start()
      }
    }
    else {
      mic.stop()
      mic.onend = () => {
        console.log("Stopped mic")
      }
    }

    mic.onstart = () => {
      console.log("Mic is on")
    }
    mic.onresult = (event) => {
      const transcript = Array.from(event.results).map(result => result[0]).map(result => result.transcript).join("")

      console.log(transcript)
      setNote(transcript)
    }
    mic.onerror = (event) => {
      console.log(event.error) 
    }
  }

  const handleMicStart = () => {
    setNote(null)
    setIsListening(true)
  }

  const [friends, setFriends] = useState(null)
  const [addFriendInput, setAddFriendInput] = useState("")
  let [addFriendError, setAddFriendError] = useState("")
  let [addingFriend, setAddingFriend] = useState(false)
  const [loading, setLoading] = useState(true)
  let [currentUser, setCurrentUser] = useState({})
  let [isChatting, setIsChatting] = useState(false)
  let [currentReceiver, setCurrentReceiver] = useState({})
  const [messages, setMessages] = useState([])
  const [notifications, setNotifications] = useState([])
  const [range, setRange] = useState({from: 0, to: 8})

  const imageUrl = "https://image.cnbcfm.com/api/v1/image/104556423-steve-jobs-iphone-10-years.jpg?v=1532563811"

  const [micModal, setMicModal] = useState(false)
  const [addFriendModal, setAddFriendModal] = useState(false)
  const [notificationModal, setNotificationModal] = useState(false)
  const [input, setInput] = useState("")


  const handleClick = () => {
      setAddFriendModal(true)
  }

  const joinRooms = (friends, currentUserId) => {
    for(let i=0; i < friends.length; i++) {
      if(friends[i].id > currentUserId) {
          console.log("Room 1")
          socket.emit("join-room", `${friends[i].email}&${localStorage.getItem("email")}`)
      }
      else if(currentUserId > friends[i].id) {
        console.log("Room2")
        socket.emit("join-room", `${localStorage.getItem("email")}&${friends[i].email}`)
      }
      else {
        console.log("Some error at " + i)
      }
    }
  }


  const fetchUserInfo = () => {
    axios.post("http://localhost:5000/api/fetch-user-info", 
      {email: localStorage.getItem("email")}).then((res) => {
        setCurrentUser({...res.data.rows[0]})
        setMessages([...res.data.rows[0].messages])
        setNotifications([...res.data.rows[0].notifications])
        axios.post("http://localhost:5000/api/fetch-friends-info", 
        {friends: res.data.rows[0].friends}).then((response) => {
          console.log(response)
          setFriends(response.data)
          if(response.data !== "No Friends!" || response.data.length !== 0) {
            joinRooms(response.data, res.data.rows[0].id)
          }
          
        }).catch((err) => {
          console.log(err)
        })
        setTimeout(() => {
            setLoading(false)
        }, 500)
      }).catch((err) => {
        console.log(err)
        setLoading(false)
      })

  }

  const handleChatClick = (id, name, email, display_pic) => {
    setIsChatting(true)
    setCurrentReceiver({...currentReceiver, id, name, email, display_pic})
  }

  const handleLogout = () => {
    localStorage.clear()
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

  const handleAddFriend = () => {
      if(addFriendInput === "") {
        console.log("Input cannot be empty!")
        setAddFriendError("Input is empty!")
      }
      else if(currentUser.email === addFriendInput) {
        setAddFriendError("You cannot add yourself!")
      }
      else if(currentUser.friends.includes(addFriendInput)) {
        setAddingFriend(true)
        setTimeout(() => {
          setAddFriendError("Friend already added!")
          setAddingFriend(false)
        }, 1500)
      }
      else {
        setAddingFriend(true)
        console.log("Address: " + addFriendInput)
        axios.post("http://localhost:5000/api/add-friend", 
        {email: localStorage.getItem("email"), friendEmail: addFriendInput, 
        name: currentUser.name})
          .then((res) => {
            if(res.data.message === "Invalid Address!") {
              console.log("Invalid Address!")
              setTimeout(() => {
                setAddingFriend(false)
                setAddFriendError("Invalid Address!")
              }, 1100)
            }
            else if(res.data.message === "Friend Added!") {
              console.log("Friend Added!")
              setTimeout(() => {
                setAddingFriend(false)
                window.location.reload()
              }, 1100)
            }
            else{
              console.log(res)
              setTimeout(() => {
                setAddingFriend(false)
                setAddFriendError("Some Error!")
              }, 1100)
            }
          }).catch((err) => {
            console.log(err)
            setTimeout(() => {
              setAddingFriend(false)
              setAddFriendError("Some Error!")
            }, 1000)
          })
      }
  }

  const handleSend = (input) => {
    const isOnline = window.navigator.onLine
    if(isOnline) {
      let currentDate = new Date()
      console.log(input)
      let id = Date.now()
      const message = {
        id: id,
        text: input,
        to: currentReceiver.email,
        from: localStorage.getItem("email"),
        time: `${currentDate.getHours()}:${currentDate.getMinutes()}`,
        date: `${currentDate.getDate()} ${currentDate.toString().split(" ")[1]} ${currentDate.getFullYear()}`
      }

      if(currentUser.id > currentReceiver.id) {
        socket.emit("send-message-room", 
        {room: `${currentUser.email}&${currentReceiver.email}`, message: message})
        setMessages([...messages, message])
           
      } 
      else if(currentReceiver.id > currentUser.id) {
        socket.emit("send-message-room", 
        {room: `${currentReceiver.email}&${currentUser.email}`, message: message})
        setMessages([...messages, message])
      }
      else {
        console.log("Error Sending Message!")
      }

      setInput("")
      setMicModal(false)
      axios.post("http://localhost:5000/api/add-message", 
      message)
        .then((res) => {
          console.log(res)
        })
        .catch((err) => {
          console.log(err)
        })
    }
    else {
      alert("No internet connection!")
    }

  }

  socket.on("add-message", (data) => {
    console.log(data)
  })


  useEffect(() => {
    handleListen()
  }, [isListening])

  useEffect(() => {
    const addMessageRoom = (data) => {
      console.log("Message Received!")
      setMessages([...messages, data])
    }

    socket.on("add-message-room", addMessageRoom)

    return () => {
      socket.off("add-message-room",addMessageRoom)
    }
  
  }, [messages])

  useEffect(() => {
      fetchUserInfo()
  }, [])



  if(loading === true) {
    return(
      <div>
        <div className='heading'>
        <p>Chatty</p>
        <div className='options-profile'>
          <img src={currentUser.display_pic === null || loading ? "https://www.theparentingplace.net/wp-content/uploads/2021/02/BlankImage.jpg": currentUser.profile_pic} alt="some-image"></img>
        </div>
        </div>
        <div className='loading-spinner'>

        </div>
      </div>
    )
  }

  else if(currentUser.friends === null || currentUser.friends.length === 0 ) {
    return(
      <div>
        <div className='heading'>
            <p>Chatty</p>
            <div className='options-profile'>
                <i className='fas fa-right-from-bracket' onClick={handleLogout} id="icon"></i>
                <img src={currentUser.display_pic === null || currentUser.display_pic === "" ? "https://www.theparentingplace.net/wp-content/uploads/2021/02/BlankImage.jpg": currentUser.profile_pic} alt="display-pic"></img>
            </div>
        </div>
        <div className='no-friends'>
            <h2>No Friends!</h2>
            <div className='add-friend'>
                <p>Add a Friend</p>
                <input placeholder="Friend's Fmail Address" 
                onChange={(e) => setAddFriendInput(e.target.value)} value={addFriendInput} />
                <button onClick={handleAddFriend} disabled={addingFriend} >
                  {addingFriend ? 
                    <div className="adding-loading-spinner"></div> :
                    <i className='fas fa-plus'></i>
                  }
                </button>
            </div>
        </div>
        {addFriendError !== "" &&
            <div className='invalid-friend-email'>
              <p>{addFriendError}</p>
            </div>
        }
      </div>
    )
  }

  return (
    <div className="app">
    <div className='all' style={{"filter": micModal || addFriendModal || notificationModal ? "blur(4px)" : "blur(0px)", "pointerEvents": micModal || addFriendModal || notificationModal ? "none" : "all"}}>
        <div className='heading'>
            <p>Chatty</p>
            <div className='options-profile'>
                <div className='bell-icon'>
                  <span>{currentUser && currentUser.notifications.length}</span>
                  <i className='fas fa-bell' onClick={() => setNotificationModal(true)}></i>
                </div>
                <i className='fas fa-right-from-bracket' onClick={handleLogout} id="icon"></i>
                <i className='fas fa-plus' onClick={handleClick} id="icon"></i>
                <img src={currentUser.disaplay_pic === null || currentUser.display_pic === "" ? "https://www.theparentingplace.net/wp-content/uploads/2021/02/BlankImage.jpg": currentUser.profile_pic} alt="some-image"></img>
            </div>
        </div>
        <div className='chats'>
            <div className='search-box'>
              <i className='fas fa-magnifying-glass'></i>
              <input placeholder='Search' />
            </div>
            {friends && friends.map((friend) => {
              const {id, name, email, display_pic} = friend
              return(
                <div key={id} className="each-chat" 
                onClick={() => handleChatClick(id, name, email, display_pic)}>
                  <div className="profile-name">
                  <img src={display_pic === null || display_pic === "" ? blank : display_pic} alt=""></img>
                    <div className='name-latest-msg'>
                      <span>{name}</span>
                      {messages.filter((msg) => msg.from === email || msg.from === currentUser.email && msg.to === email).pop()?.from === currentUser.email ? 
                        <p>
                          Me: {messages.filter((msg) => msg.from === email || msg.from === currentUser.email && msg.to === email).pop()?.text}
                        </p> :
                        <p>
                          {messages.filter((msg) => msg.from === email || msg.from === currentUser.email && msg.to === email).pop()?.text}
                        </p>
                      }
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
        <div className={isChatting ? "chat-screen-show" : "chat-screen-hidden"}>
            <div className='current-chat'>
              <div className='current-chat-name-image'>
                <img src={currentReceiver && currentReceiver.display_pic === null || currentReceiver.display_pic === "" ? blank : currentReceiver.display_pic}></img>
                <span>{currentReceiver && currentReceiver.name}</span>
              </div>
              <div className='info-icon'>
                  <i className='fas fa-info' onClick={() => console.log("Info")}>
                  </i>
              </div>
            </div>
            <div className='messages'>
                {messages.filter((msg) => msg.from === currentReceiver.email || msg.from === currentUser.email && msg.to === currentReceiver.email).length === 0 && 
                  <span className='no-messages'>
                    No messages yet!
                  </span>
                }
                
                { messages.filter((msg) => msg.from === currentReceiver.email || msg.from === currentUser.email && msg.to === currentReceiver.email).length > 0 &&
                messages.filter((msg) => msg.from === currentReceiver.email || msg.from === currentUser.email && msg.to === currentReceiver.email).map((msg) => {
                    const {id, text, from, time, date, to} = msg
                    return(
                      <span key={id} className={from === localStorage.getItem("email") ? "own" : "other"}>
                        <span className='time'>
                          {date !== 
                          `${today.getDate()} ${today.toString().split(" ")[1]} ${today.getFullYear()}` ? date : 
                          time.split(":")[0] > 12 & time.split(":")[1] > 0 ? `${time.split(":")[0] - 12}:${time.split(":")[1]}` + " PM" : time + " AM"}
                        </span>
                        <p>{text}</p>
                      </span>
                    )
                  })
                }
            </div>
            <div className='send'>
              <input placeholder='Type a message...' onChange={(e) => setInput(e.target.value)} value={input} />
              <div className='send-mic-icons'>
                <i className='fas fa-paper-plane' 
                id="send-icon"
                onClick={() => input === "" ? null : handleSend(input)}>
                </i>
                <i className="fas fa-microphone" id="mic-icon"
                onClick={() => {setMicModal(true); setNote(null)}}>
                </i>
              </div>
            </div>
            <div className='open-chats'>
                <button onClick={() => setIsChatting(false)}>
                  <i className='fas fa-angle-right'></i>
                </button>
            </div>
        </div>
    </div>
    {micModal && 
      <div className='mic-modal'>
      <p>Recording: {isListening ? "Yes" : "No"}</p>
      <div className='speech-msg'>
          <textarea maxLength={197} readOnly value={note === null ? "" : note}></textarea>
      </div>
      <div className='modal-buttons'>
          <button onClick={() => !isListening ? handleMicStart() : setIsListening(false)}>{isListening ? "Stop" : "Start"}</button>
          <button onClick={() => {
            setMicModal(false)
            setNote(null)
            setIsListening(false)
          }}>
            Close
          </button>
          <button onClick={() => note === null ? console.log("No Note!") : handleSend(note)} disabled={isListening}>Send</button>
      </div>
      </div>
      }
      {addFriendModal && 
        <div className='add-friend-modal'>
          <i className='fas fa-times' onClick={() => setAddFriendModal(false)}></i>
          <input placeholder="Friend's Fmail Address" value={addFriendInput} 
          onChange={(e) => setAddFriendInput(e.target.value)} />
          {addingFriend ? 
            <button>
            <div className='adding-loading-spinner'></div>
            </button> :
            <button onClick={handleAddFriend}>Add</button>
          }
          {addFriendError !== "" && 
            <span className='add-friend-error'>{addFriendError}</span>
          }
        </div>
      }
      {notificationModal && 
        <div className='notification-modal'>
          <div className='modal-header'>
            <h3>Notifications ({notifications.length})</h3>
            <i className='fas fa-times' onClick={() => {
              setRange({...range, from: 0, to: 8})
              setNotificationModal(false)
            }}></i>
          </div>
          <div className='notifications'>
            {notifications.length === 0 && 
              <div className='no-notifications'>
                <p>No notifications!</p>
              </div>
            }
            {notifications.length > 8 ? 
              notifications.slice(range.from, range.to).map((notification) => {
                const {id, message, time, date} = notification
                return(
                  <div key={id} className='each-notification'>
                    <p>{message}</p>
                    <span>
                    {date !== 
                          `${today.getDate()} ${today.toString().split(" ")[1]} ${today.getFullYear()}` ? date : 
                          time.split(":")[0] > 12 & time.split(":")[1] > 0 ? `${time.split(":")[0] - 12}:${time.split(":")[1]}` + " PM" : time + " AM"}
                    </span>
                  </div>
                )
              }) :
              notifications.map((notification) => {
                const {id, message, time, date} = notification
                return(
                  <div className='each-notification' key={id}>
                    <p>{message}</p>
                    <span>
                    {date !== 
                          `${today.getDate()} ${today.toString().split(" ")[1]} ${today.getFullYear()}` ? date : 
                          time.split(":")[0] > 12 & time.split(":")[1] > 0 ? `${time.split(":")[0] - 12}:${time.split(":")[1]}` + " PM" : time + " AM"}
                    </span>
                  </div>
                )
              })
            }
          </div>
          {notifications.length === 0 ? null :
            <div className='load-more'>
              <button disabled={notifications.length + 1 === range.to || notifications.length === 0 || notifications.length < 8} onClick={() => {
                console.log("Clicked")
                if(notifications.length > 16) {
                  setRange({...range, from: 8, to: 16})
                }
                else {
                  setRange({...range, from: 8, to: notifications.length + 1})
                }
              }}>
                Show more
              </button>
            </div>
          }
          
        </div>
      }
    
    </div>
  )
}

export default Chats