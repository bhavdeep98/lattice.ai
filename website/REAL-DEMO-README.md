# Real Lattice Framework Demo

This is a **real demo** that uses the actual Lattice framework to generate production-ready AWS infrastructure from natural language input.

## 🎯 What This Demo Does

Unlike the previous mock demo, this actually:

1. **Uses Real Lattice Code**: Imports and uses the actual `LatticeStack` and `LatticeManifest` from `../src`
2. **Generates Real CDK Code**: Creates actual TypeScript CDK applications
3. **Synthesizes CloudFormation**: Attempts to run `cdk synth` to generate real AWS templates
4. **Shows the 3-Layer Process**: Intent → Framework → CloudFormation

## 🏗️ Architecture

```
User Input → AI Analysis → Lattice Manifest → CDK Code → CloudFormation
```

### Components:

- **Frontend**: `real-lattice-demo.html` - Clean interface for input/output
- **Backend**: `lattice-demo-backend.js` - Node.js server using real Lattice framework
- **Framework**: Uses actual `../src/` Lattice modules

## 🚀 Quick Start

### Option 1: Automatic Setup

```bash
cd website
./start-real-demo.sh
```

### Option 2: Manual Setup

```bash
cd website

# Install dependencies
npm install

# Start backend
node lattice-demo-backend.js

# In another terminal, start frontend server
python3 -m http.server 8001
```

Then visit: `http://localhost:8001/real-lattice-demo.html`

## 📋 API Endpoints

The backend provides these endpoints:

- `POST /api/generate` - Generate infrastructure from user input
- `GET /api/demo/:id` - Retrieve a specific demo
- `GET /api/demos` - List all generated demos
- `GET /api/health` - Health check

## 🎮 How to Use

1. **Enter Requirements**: Describe what you want to build in natural language
2. **Generate**: Click "Generate with Lattice"
3. **View Results**: See the 3-step process:
   - AI Intent (Lattice Manifest)
   - CDK Code Generation
   - CloudFormation Synthesis

## 🧪 Example Inputs

Try these examples:

```
I need a healthcare platform with claims processing, patient data management, and HIPAA compliance
```

```
Build an e-commerce platform with product catalog, payment processing, and order management
```

```
Create a blog platform with user authentication, content management, and file uploads
```

## 🔧 How It Works

### 1. AI Analysis

The backend analyzes natural language input and maps it to Lattice capabilities:

```javascript
// Input: "I need a healthcare platform with database"
// Output:
{
  appName: 'healthcare-platform',
  environment: 'prod',
  capabilities: {
    api: { type: 'serverless', runtime: 'python3.9' },
    database: { engine: 'postgres', encryption: true }
  }
}
```

### 2. CDK Code Generation

Creates real TypeScript code using Lattice:

```typescript
import { LatticeStack, LatticeManifest } from '../src';

const manifest: LatticeManifest = {
  /* generated manifest */
};
const stack = new LatticeStack(app, 'HealthcareStack', manifest);
```

### 3. CloudFormation Synthesis

Attempts to run `cdk synth` to generate the final CloudFormation template.

## 🎯 Value Demonstration

This demo shows why Lattice is valuable:

- **No Missing Dependencies**: Unlike manual CloudFormation, Lattice automatically includes all required resources
- **Type Safety**: Full TypeScript support prevents common infrastructure errors
- **Production Ready**: Includes security, monitoring, and best practices by default
- **AI Friendly**: Simple manifest format perfect for AI generation

## 🔍 Troubleshooting

### Backend Not Starting

```bash
# Check Node.js version
node --version  # Should be 16+

# Install dependencies
npm install

# Check for port conflicts
lsof -i :3001
```

### CDK Synthesis Fails

This is expected in the demo environment. The demo shows:

- ✅ Manifest generation (works)
- ✅ CDK code generation (works)
- ⚠️ CloudFormation synthesis (may fail without full CDK setup)

In a real environment with proper AWS CDK setup, all steps would work.

### CORS Issues

Make sure both servers are running:

- Backend: `http://localhost:3001`
- Frontend: `http://localhost:8001`

## 🚀 Production Deployment

To use this in production:

1. **Install AWS CDK**: `npm install -g aws-cdk`
2. **Configure AWS**: `aws configure`
3. **Bootstrap CDK**: `cdk bootstrap`
4. **Deploy**: The generated CDK code can be deployed with `cdk deploy`

## 📊 Comparison: Mock vs Real Demo

| Feature      | Mock Demo            | Real Demo        |
| ------------ | -------------------- | ---------------- |
| Framework    | Fake JSON generation | Real Lattice CDK |
| Validation   | None                 | TypeScript + CDK |
| Dependencies | Manual/Missing       | Automatic        |
| Deployment   | Not possible         | Production ready |
| Value Demo   | Limited              | Complete         |

## 🎓 Educational Value

This demo teaches:

1. **How Lattice Actually Works**: Real framework, not simulation
2. **AI → Infrastructure Pipeline**: Complete end-to-end process
3. **CDK Best Practices**: Type-safe infrastructure as code
4. **Production Readiness**: Security, monitoring, compliance built-in

## 🔗 Integration

This demo can be integrated into:

- **Sales Presentations**: Show real value to prospects
- **Developer Onboarding**: Hands-on Lattice experience
- **Documentation**: Live examples in docs
- **Marketing Website**: Interactive product demonstration

---

**This is the real Lattice framework in action!** 🚀
