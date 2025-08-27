# 🍌 Nano-Banana Showcase

A powerful AI-powered image transformation playground showcasing the capabilities of **Gemini 2.5 Flash Image** (aka nano-banana) model on [fal.ai](https://fal.ai). Transform images with weather effects, create portraits, and add objects to images - all powered by cutting-edge AI technology.

## ✨ Features

- **🌦️ Weather Change**: Transform any scene with different weather conditions
- **🎨 Portrait Generation**: Create stunning AI portraits from photos
- **🎭 Object Holding**: Add objects to images with natural integration
- **⚡ Real-time Processing**: Fast image generation powered by fal.ai infrastructure
- **🔒 Rate Limiting**: Built-in protection for production deployments
- **🎯 Custom API Key Support**: Use your own fal.ai API key for using your credits

## 🚀 Quick Start

### Prerequisites

- Node.js 18.x or higher
- npm, yarn, pnpm, or bun package manager
- A fal.ai API key (get one at [fal.ai](https://fal.ai))

### Installation

1. **Fork or clone this repository**
```bash
git clone https://github.com/fal-ai-community/fal-banana.git
cd fal-banana
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. **Configure environment variables**

Copy the example environment file:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your configuration:
```env
# Required: Your fal.ai API key
FAL_KEY=your_fal_api_key_here

# Optional: Security configuration for production
# Comma-separated list of allowed image URL domains (for SSRF protection)
# Example: https://v3.fal.media,https://storage.googleapis.com
ALLOWED_IMAGE_DOMAINS=

# Optional: Rate limiting configuration
PLAYGROUND_RATE_LIMIT=200
HOURLY_LIMIT=10
DAILY_LIMIT=40

# Environment
NODE_ENV=development
```

4. **Run the development server**
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🛠️ Technology Stack

- **Framework**: [Next.js 15.4.6](https://nextjs.org/) with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4 with PostCSS
- **UI Components**: Radix UI primitives + shadcn/ui
- **AI Integration**: [@fal-ai/client](https://www.npmjs.com/package/@fal-ai/client)
- **React**: 19.1.0 with React DOM 19.1.0
- **Development**: Turbopack for faster builds

## 📁 Project Structure

```
fal-banana/
├── src/
│   ├── app/
│   │   ├── api/           # API routes for fal.ai integration
│   │   │   ├── fal/       # Main fal.ai endpoint
│   │   │   ├── fal-stream/# Streaming API endpoint
│   │   │   └── fal-upload/# Image upload endpoint
│   │   ├── playground/    # Main playground application
│   │   │   ├── components/# React components
│   │   │   └── page.tsx   # Playground page
│   │   └── page.tsx       # Home page (redirects to playground)
│   ├── components/        # Shared UI components
│   ├── lib/              # Utility functions and helpers
│   │   ├── rate-limit.ts # Rate limiting logic
│   │   └── url-validator.ts # URL validation for security
│   └── middleware.ts      # Next.js middleware for rate limiting
├── public/               # Static assets
├── .env.local.example    # Environment variables template
├── package.json          # Dependencies and scripts
├── next.config.ts        # Next.js configuration
├── tailwind.config.ts    # Tailwind CSS configuration
└── tsconfig.json         # TypeScript configuration
```

## 🎯 Use Cases

This showcase demonstrates how to:

1. **Build AI-powered applications** using fal.ai's infrastructure
2. **Integrate multiple AI models** into a single interface
3. **Implement production-ready features** like rate limiting and security


## 🔧 Customization

### Adding New Features

1. Create a new component in `src/app/playground/components/`
2. Add the corresponding API route in `src/app/api/`
3. Integrate with fal.ai models using the [@fal-ai/client](https://www.npmjs.com/package/@fal-ai/client) library

### Using Different Models

Explore other models available on [fal.ai](https://fal.ai/models) and integrate them by:

1. Finding the model ID on fal.ai
2. Updating the API endpoint with the new model
3. Adjusting input parameters as needed

### Custom Styling

The project uses Tailwind CSS v4. Modify the theme in `tailwind.config.ts` or add custom styles in component files.

## 🚢 Deployment

### Deploy on Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/fal-ai-community/fal-banana&env=FAL_KEY&envDescription=Your%20fal.ai%20API%20key&envLink=https://fal.ai)

1. Click the button above
2. Add your `FAL_KEY` environment variable
3. Deploy!

### Manual Deployment

1. Build the production bundle:
```bash
npm run build
```

2. Start the production server:
```bash
npm run start
```

### Environment Variables for Production

Make sure to set these environment variables in your deployment platform:

- `FAL_KEY` (required): Your fal.ai API key
- `ALLOWED_IMAGE_DOMAINS` (recommended): Whitelist domains for security
- `NODE_ENV`: Set to `production`
- Rate limiting variables as needed

## 🤝 Contributing

We welcome contributions! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is open source and available for anyone to use, modify, and distribute. Feel free to use it as a starting point for your own AI-powered applications.

## 🔗 Links

- **GitHub Repository**: [github.com/fal-ai-community/fal-banana](https://github.com/fal-ai-community/fal-banana)
- **fal.ai Documentation**: [docs.fal.ai](https://docs.fal.ai)
- **Model Playground**: [fal.ai/models](https://fal.ai/models)
- **Get API Key**: [fal.ai](https://fal.ai)

## 💡 About Nano-Banana

Nano-banana (Gemini 2.5 Flash Image) is a powerful and fast image generation model that excels at:
- Quick image transformations
- Understanding complex prompts
- Maintaining image quality

This showcase demonstrates its capabilities through practical, fun applications that you can extend and customize for your own projects.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/fal-ai-community/fal-banana/issues)
- **fal.ai Support**: [support@fal.ai](mailto:support@fal.ai)
- **Documentation**: [docs.fal.ai](https://docs.fal.ai)

---

Built with ❤️ using [fal.ai](https://fal.ai) • Powered by nano-banana 🍌