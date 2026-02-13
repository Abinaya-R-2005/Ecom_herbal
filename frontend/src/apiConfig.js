const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://api.momsecretoil.in'; // Replace with your actual production API URL if it's different

export default API_BASE_URL;
