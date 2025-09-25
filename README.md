# JesusLetter - AI-Powered Letter Writing Application

A modern web application that helps users write personalized letters using AI assistance from Gemini and OpenAI.

## Features

- 🤖 AI-powered letter writing with Gemini and OpenAI integration
- 📱 Responsive design with modern UI
- 🔒 Secure API with rate limiting and CORS protection
- 🚀 Easy deployment with Docker
- ⚡ Fast development with Vite and Express
- 📊 Health monitoring and logging
- 🎯 Optimized performance with code splitting and caching
- 🛡️ Enhanced security with Nginx and CSP headers
- 📦 PWA support with offline capabilities

## Tech Stack

### Frontend
- **Vite** - Fast build tool with optimized code splitting
- **Vue.js** - Progressive JavaScript framework
- **CSS3** - Modern styling with responsive design
- **Service Worker** - PWA and offline capabilities
- **Capacitor** - Cross-platform mobile deployment

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Helmet** - Security middleware
- **Express Rate Limit** - Rate limiting middleware
- **CORS** - Cross-origin resource sharing

### Infrastructure
- **Nginx** - Reverse proxy with optimized caching
- **Docker** - Containerized deployment
- **Docker Compose** - Multi-container orchestration

### AI Services
- **Google Gemini API** - Advanced AI text generation
- **OpenAI API** - GPT-powered text generation

## Performance Optimizations

### Frontend Optimizations
- **Code Splitting**: Automatic chunking for Vue, AI services, Capacitor, and utilities
- **Asset Optimization**: Minification with Terser, CSS code splitting
- **Caching Strategy**: Service Worker with intelligent caching
- **Bundle Analysis**: Optimized dependencies and tree shaking

### Backend Optimizations
- **Rate Limiting**: Configurable limits for general and AI endpoints
- **Security Headers**: Comprehensive security with Helmet
- **Request Logging**: Structured logging with performance monitoring
- **Error Handling**: Graceful error handling and recovery

### Infrastructure Optimizations
- **Nginx Caching**: Static assets cached for 1 year with immutable headers
- **Gzip Compression**: Optimized compression for all text-based assets
- **Security Headers**: HSTS, CSP, and other security enhancements
- **Health Checks**: Comprehensive monitoring endpoints

## Quick Start

### Prerequisites
- Node.js 18+ 
- Docker and Docker Compose (for deployment)
- API keys for Gemini and/or OpenAI

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd JesusLtter
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. **Start development servers**
   
   Frontend (Terminal 1):
   ```bash
   npm run dev
   ```
   
   Backend (Terminal 2):
   ```bash
   cd server
   node app.js
   ```

5. **Access the application**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3002/api
   - Health Check: http://localhost:3002/api/health

### Production Deployment

#### Using Docker (Recommended)

1. **Quick deployment**
   ```bash
   # On Windows
   deploy.bat
   
   # On Linux/Mac
   chmod +x deploy.sh
   ./deploy.sh
   ```

2. **Manual Docker deployment**
   ```bash
   # Build and start containers
   docker-compose up --build -d
   
   # View logs
   docker-compose logs -f
   
   # Stop containers
   docker-compose down
   ```

#### Manual Deployment

1. **Build frontend**
   ```bash
   npm run build
   ```

2. **Start backend**
   ```bash
   cd server
   NODE_ENV=production node app.js
   ```

3. **Serve with Nginx (Recommended)**
   Use the provided `nginx.conf` for optimized performance:
   - Static asset caching (1 year)
   - Gzip compression
   - Security headers
   - API proxy to backend

## Performance Monitoring

### Frontend Performance
- **Bundle Analysis**: Use `npm run build` to see chunk sizes
- **Lighthouse**: Run audits for performance, accessibility, and SEO
- **Service Worker**: Monitor cache hit rates in DevTools

### Backend Performance
- **Health Endpoints**: 
  - `/api/health` - Basic health check
  - `/api/health/detailed` - Detailed system information
- **Request Logging**: Structured logs with timing information
- **Rate Limiting**: Monitor API usage and limits

### Infrastructure Monitoring
- **Nginx Logs**: Access and error logs for traffic analysis
- **Docker Stats**: Container resource usage monitoring
- **Cache Performance**: Monitor Nginx cache hit rates

## Environment Variables

Create a `.env` file in the root directory:

```env
# Application Configuration
APP_NAME=JesusLetter
APP_VERSION=1.0.0
NODE_ENV=development
PORT=3002

# AI Service API Keys
GEMINI_API_KEY=your-gemini-api-key-here
OPENAI_API_KEY=your-openai-api-key-here

# Server Configuration
CORS_ORIGIN=http://localhost:3001
JWT_SECRET=your-jwt-secret-key-here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info

# Frontend Configuration
VITE_API_BASE_URL=http://localhost:3002/api
VITE_APP_NAME=JesusLetter
VITE_APP_VERSION=1.0.0
```

## API Endpoints

### Health Check
- `GET /api/health` - Application health status

### AI Services
- `GET /api/ai/status` - AI services status
- `POST /api/ai/generate` - Generate AI content

## Project Structure

```
JesusLtter/
├── src/                    # Frontend source code
│   ├── config/            # Configuration files
│   ├── js/                # JavaScript modules
│   ├── css/               # Stylesheets
│   └── index.html         # Main HTML file
├── server/                # Backend source code
│   ├── middleware/        # Express middleware
│   ├── routes/           # API routes
│   └── app.js            # Main server file
├── dist/                 # Built frontend files
├── docker-compose.yml    # Docker Compose configuration
├── Dockerfile.frontend   # Frontend Docker configuration
├── Dockerfile.backend    # Backend Docker configuration
├── nginx.conf           # Nginx configuration
├── deploy.sh            # Linux/Mac deployment script
├── deploy.bat           # Windows deployment script
└── package.json         # Node.js dependencies
```

## Development

### Available Scripts

- `npm run dev` - Start frontend development server
- `npm run build` - Build frontend for production
- `npm run preview` - Preview production build
- `npm run server` - Start backend server

### Code Style

- Use ES6+ features
- Follow consistent naming conventions
- Add comments for complex logic
- Use meaningful variable and function names

## Security Features

- **Helmet.js** - Sets various HTTP headers for security
- **CORS** - Configurable cross-origin resource sharing
- **Rate Limiting** - Prevents API abuse
- **Input Validation** - Validates and sanitizes user input
- **Environment Variables** - Sensitive data protection

## Monitoring and Logging

- **Morgan** - HTTP request logging
- **Health Check Endpoint** - Application status monitoring
- **Error Handling** - Comprehensive error handling and logging
- **Docker Health Checks** - Container health monitoring

## Troubleshooting

### Common Issues

1. **Port conflicts**
   - Frontend runs on port 3001, backend on port 3002
   - Change ports in `.env` file if needed
   - Kill processes using the ports: `netstat -ano | findstr :3001`

2. **API key errors**
   - Verify API keys in `.env` file
   - Check API key permissions and quotas
   - Ensure proper environment variable loading

3. **Docker issues**
   - Ensure Docker is running
   - Check Docker Compose version compatibility
   - Use `docker-compose logs` to debug container issues

4. **Build errors**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check Node.js version compatibility (18+)
   - Verify all dependencies are properly installed

5. **Module import errors**
   - Ensure ES6 modules are properly configured
   - Check file extensions and import paths
   - Verify export/import syntax consistency

6. **Performance issues**
   - Monitor bundle sizes with `npm run build`
   - Check network requests in DevTools
   - Verify service worker caching is working

### Debug Commands

```bash
# Check running processes
netstat -ano | findstr :3001
netstat -ano | findstr :3002

# View Docker logs
docker-compose logs -f

# Check Node.js version
node --version

# Verify environment variables
node -e "console.log(process.env)"

# Test API endpoints
curl http://localhost:3002/api/health
curl http://localhost:3002/api/ai/status
```

### Performance Optimization Tips

1. **Frontend Optimization**
   - Enable service worker for caching
   - Use code splitting for large components
   - Optimize images and assets
   - Monitor Core Web Vitals

2. **Backend Optimization**
   - Implement proper error handling
   - Use rate limiting to prevent abuse
   - Monitor API response times
   - Optimize database queries if applicable

3. **Infrastructure Optimization**
   - Use Nginx for static file serving
   - Enable gzip compression
   - Implement proper caching headers
   - Monitor server resources

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m 'Add feature'`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section above
- Review the API documentation

## Changelog

### Version 1.0.0
- Initial release with AI-powered letter writing
- Gemini and OpenAI integration
- Responsive web interface
- Docker deployment support
- Performance optimizations
- Security enhancements

- **Development**: Check browser console and terminal output
- **Production**: Use `docker-compose logs -f` for container logs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Check the troubleshooting section
- Review the logs for error messages
- Open an issue on the repository

---

Made with ❤️ for better communication through AI-assisted letter writing.