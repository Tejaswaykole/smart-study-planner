function login() {

    const email =
        document.getElementById('email').value;

    const password =
        document.getElementById('password').value;

    fetch('http://localhost:5000/login', {

        method: 'POST',

        headers: {
            'Content-Type': 'application/json'
        },

        body: JSON.stringify({
            email,
            password
        })

    })

    .then(res => res.json())

    .then(data => {

        if (!data.success) {

            alert('Login failed');
            return;

        }

        localStorage.setItem(
            'token',
            data.token
        );

        localStorage.setItem(
            'userId',
            data.user.id
        );

        localStorage.setItem(
            'username',
            data.user.username
        );

        window.location.href =
            'dashboard.html';

    })

    .catch(console.error);

}
