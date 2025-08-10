# JarrBank API

Backend API server for JarrBank DeFi portfolio tracker.

## Deployment to Railway

### Prerequisites

1. Railway account with project created
2. GitHub repository connected to Railway
3. Required environment variables configured

### Environment Variables

Configure these in Railway dashboard:

```bash
# Server Configuration
NODE_ENV=production
HOST=0.0.0.0
PORT=${{PORT}}  # Railway provides this
LOG_LEVEL=info

# Frontend URL for CORS
FRONTEND_URL=https://jarrbank.vercel.app

# Price Data APIs
MORALIS_API_KEY=<your_moralis_key>
COINMARKETCAP_API_KEY=<your_cmc_key>

# RPC Configuration
ALCHEMY_API_KEY=<your_alchemy_key>
ALCHEMY_ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/<key>
ALCHEMY_ARB_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/<key>
ALCHEMY_AVAX_RPC_URL=https://avax-mainnet.g.alchemy.com/v2/<key>
INFURA_PROJECT_ID=<your_infura_id>
INFURA_PROJECT_SECRET=<your_infura_secret>

# Database & Cache
DATABASE_URL=<supabase_postgres_url>
SUPABASE_URL=<supabase_project_url>
SUPABASE_ANON_KEY=<supabase_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<supabase_service_key>
REDIS_URL=<redis_connection_string>

# Security
RATE_LIMIT_MAX=100
RATE_LIMIT_TIME_WINDOW=60000
CORS_CREDENTIALS=true
```

### Deployment Steps

1. **Initial Setup:**
   - Connect GitHub repo to Railway
   - Set root directory to `/`
   - Set build command: `npm run build:deps && npm run build --scope=@jarrbank/api`
   - Set start command: `node apps/api/dist/server.js`
   - Enable Docker builds with path: `apps/api/Dockerfile`

2. **Configure Environment:**
   - Add all required environment variables in Railway dashboard
   - Railway automatically provides `PORT` variable

3. **Deploy:**
   - Push to main branch triggers automatic deployment
   - Or manually trigger via Railway dashboard

4. **Verify Deployment:**
   - Check health endpoint: `https://<your-app>.up.railway.app/health`
   - Test tRPC endpoint: `https://<your-app>.up.railway.app/trpc`

### CI/CD Pipeline

GitHub Actions workflow (`deploy-api.yml`) handles:
- Automatic deployment on push to main
- Health checks after deployment
- Updates Vercel environment with API URL

### Endpoints

- `/health` - Health check endpoint
- `/trpc/*` - tRPC API endpoints
- `/api/rpc/batch` - RPC batch operations
- `/api/balances/:chainId/:address` - Get token balances
- `/api/stats/queue` - Queue statistics
- `/api/stats/errors` - Error metrics

### Local Development

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your credentials

# Run development server
npm run dev

# Run tests
npm test
```

### Monitoring

- Health endpoint provides service status
- Queue stats show RPC batch processing metrics
- Error metrics track failures by chain/provider

### Troubleshooting

1. **CORS Issues:**
   - Verify `FRONTEND_URL` is set correctly
   - Check allowed origins in server.ts

2. **RPC Connection Failures:**
   - Verify API keys are correct
   - Check rate limits on provider dashboard

3. **Database Connection:**
   - Ensure Supabase credentials are valid
   - Check connection string format

4. **Redis Connection:**
   - Verify Redis URL includes auth if required
   - Check Redis service is running