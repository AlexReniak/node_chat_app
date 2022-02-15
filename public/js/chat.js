const socket = io()

const messageForm = document.querySelector('#message-form')
const messageFormInput = document.querySelector('#form-message')
const submitBtn = document.querySelector('#submit-btn')
const locationBtn = document.querySelector('#send-location')
const messages = document.querySelector('#messages')


const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML


const userFormInput = Qs.parse(location.search, { ignoreQueryPrefix: true })


const autoscroll = () => {
    const newMessage = messages.lastElementChild

    const newMessageStyles = getComputedStyle(newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin

    const visibleHeight = messages.offsetHeight

    const containerHeight = messages.scrollHeight

    const scrollOffset = messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset) {
        messages.scrollTop = messages.scrollHeight
    }
}


socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (position) => {
    console.log(position)
    const locationHtml = Mustache.render(locationTemplate, {
        username: position.username,
        url: position.url,
        createdAt: moment(position.createdAt).format('h:mm a')
    })
    messages.insertAdjacentHTML('beforeend', locationHtml)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })

    document.querySelector('#sidebar').innerHTML = html
})

messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    submitBtn.setAttribute('disabled', 'disabled')

    const formValue = messageFormInput.value

    socket.emit('sendMessage', formValue, (error) => {

        submitBtn.removeAttribute('disabled')
        messageFormInput.value = ''
        messageFormInput.focus()

        if(error) {
            return console.log(error)
        }

        console.log('Message deliverd')
    })
})

locationBtn.addEventListener('click', () => {

    if(!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser')
    }

    locationBtn.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {

        const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }


        socket.emit('sendLocation', coords, (message) => {
            console.log(message)

            locationBtn.removeAttribute('disabled')
        })
    })
})

socket.on('locationMessage', (message) => {
    console.log(message)
})

socket.emit('join', { username: userFormInput.username , room: userFormInput.room }, (error) => {
    if(error) {
        alert(error)
        location.href = '/'
    }
})