function register() {

    const username =
        document.getElementById('username').value;

    const email =
        document.getElementById('email').value;

    const password =
        document.getElementById('password').value;

    const confirmPassword =
        document.getElementById('confirm-password').value;

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    fetch('http://localhost:5000/register', {

        method: 'POST',

        headers: {
            'Content-Type': 'application/json'
        },

        body: JSON.stringify({
            username,
            email,
            password
        })

    })

    .then(res => res.json())

    .then(data => {

        if (!data.success) {
            alert('Registration failed');
            return;
        }

        alert('Registration successful');

        window.location.href =
            'login.html';

    })

    .catch(console.error);

}
