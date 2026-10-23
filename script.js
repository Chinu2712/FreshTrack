const helpForm = document.getElementById('helpForm');

if (helpForm) {
    helpForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const responseDiv = document.getElementById('formResponse');
        const submitBtn = document.getElementById('submitBtn');
        const originalButtonText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;

        try {
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                body: new FormData(helpForm)
            });
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Something went wrong.');
            }

            responseDiv.style.color = 'green';
            responseDiv.textContent = 'Message sent successfully! We will contact you soon.';
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
