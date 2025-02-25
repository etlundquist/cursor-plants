# Plant Care Application

A full-stack web application for managing plant care routines and tracking plant health. Built with React, Node.js, Express, and MongoDB.

## 🌱 Features

- User authentication and authorization
- Plant management (add, edit, delete plants)
- Care schedule tracking
- Watering and fertilization reminders
- Plant health monitoring
- Responsive design for mobile and desktop

## 🚀 Tech Stack

### Frontend
- React.js
- React Router
- CSS Modules
- Axios for API calls

### Backend
- Node.js
- Express.js
- MongoDB
- JWT Authentication

### Infrastructure
- Docker
- Docker Compose
- MongoDB

## 📋 Prerequisites

- Docker and Docker Compose
- Node.js (for local development)
- npm or yarn
- Git

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/plant-care.git
cd plant-care
```

2. Create necessary environment files:

For backend (.env):
```bash
MONGODB_URI=mongodb://mongodb:27017/plant-care
JWT_SECRET=your-secret-key-here
PORT=8000
NODE_ENV=development
```

For frontend (.env):
```bash
REACT_APP_API_URL=http://localhost:8000/api
```

3. Start the application using Docker Compose:
```bash
docker-compose -f docker-compose.dev.yml up
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- MongoDB: localhost:27017

## 🧪 Development

### Running Services Individually

Frontend:
```bash
cd frontend
npm install
npm start
```

Backend:
```bash
cd backend
npm install
npm run dev
```

### Running Tests
```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd backend
npm test
```

## 📁 Project Structure

```
plant-care/
├── frontend/              # React frontend application
├── backend/              # Node.js/Express backend API
├── docker-compose.dev.yml # Docker development configuration
├── .gitignore           # Git ignore rules
└── README.md            # Project documentation
```

## 🔒 Environment Variables

### Backend Variables
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT token generation
- `PORT`: Server port (default: 8000)
- `NODE_ENV`: Environment mode (development/production)

### Frontend Variables
- `REACT_APP_API_URL`: Backend API URL
- `NODE_ENV`: Environment mode
- `WDS_SOCKET_HOST`: WebSocket host for development
- `WDS_SOCKET_PORT`: WebSocket port for development

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- Plant care information resources
- Open source community
- All contributors

## 📫 Support

For support, email your.email@example.com or open an issue in the repository.
