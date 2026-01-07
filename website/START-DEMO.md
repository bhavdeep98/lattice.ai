# 🚀 Start the Real Lattice Demo

## Quick Start (Recommended)

```bash
cd website
./start-real-demo.sh
```

Then visit: **http://localhost:8001/real-lattice-demo.html**

## Manual Start

### 1. Start Backend
```bash
cd website
npm install
node lattice-demo-backend.js
```

### 2. Start Frontend (in another terminal)
```bash
cd website
python3 -m http.server 8001
```

### 3. Open Demo
Visit: **http://localhost:8001/real-lattice-demo.html**

## 🎯 What You'll See

1. **Real Lattice Framework**: Uses actual `../src/` code
2. **AI Intent Generation**: Natural language → Lattice Manifest
3. **CDK Code Generation**: Real TypeScript CDK applications
4. **CloudFormation Synthesis**: Attempts real `cdk synth`

## 🧪 Try These Examples

- "I need a healthcare platform with claims processing and HIPAA compliance"
- "Build an e-commerce platform with payment processing"
- "Create a blog with user authentication and file uploads"

## 🔧 Troubleshooting

- **Port 3001 in use**: Kill existing process or change port in backend
- **CORS errors**: Make sure both servers are running
- **CDK synthesis fails**: Expected in demo environment

---

**This is the real Lattice framework, not a simulation!** 🎉