const helpForm = document.getElementById('helpForm');

if (helpForm) {
    helpForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const responseDiv = document.getElementById('formResponse');
        const submitBtn = document.getElementById('submitBtn');
        const accessKey = helpForm.elements.namedItem('access_key').value.trim();
        const email = helpForm.elements.namedItem('email').value.trim();
        const message = helpForm.elements.namedItem('message').value.trim();
        const recipient = 'shauryasalke@gmail.com';

        if (!accessKey || accessKey === 'YOUR_ACCESS_KEY') {
            const subject = 'FreshTrack Help/Contact Message';
            const body = 'From: ' + email + '\n\n' + message;
            window.location.href = 'mailto:' + recipient +
                '?subject=' + encodeURIComponent(subject) +
                '&body=' + encodeURIComponent(body);
            responseDiv.style.color = '';
            responseDiv.textContent =
                'Opening an email draft to ' + recipient + '. Review it and press Send in your email app.';
            return;
        }

        const originalButtonText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;

        try {
            const formData = new FormData(helpForm);
            formData.set('replyto', email);
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Something went wrong.');
            }

            responseDiv.style.color = 'green';
            responseDiv.textContent =
                'Message sent successfully to the inbox configured for this Web3Forms access key.';
            helpForm.reset();
        } catch (error) {
            responseDiv.style.color = 'red';
            responseDiv.textContent = error.message || 'Network error. Please try again later.';
        } finally {
            submitBtn.textContent = originalButtonText;
            submitBtn.disabled = false;
        }
    });
}
