# Contributing to Lattice AWS CDK

Thank you for your interest in contributing to Lattice AWS CDK! We welcome contributions from the community.

## 🎯 Ways to Contribute

- **Bug Reports**: Report bugs via GitHub Issues
- **Feature Requests**: Suggest new features or improvements
- **Code Contributions**: Submit pull requests for bug fixes or features
- **Documentation**: Improve or expand documentation
- **Examples**: Add new example use cases

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- AWS CLI configured with credentials
- Basic understanding of AWS CDK
- TypeScript knowledge

### Setup Development Environment

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/lattice-aws-cdk.git
   cd lattice-aws-cdk
   ```

2. **Install dependencies**
   ```bash
   npm ci
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Run tests**
   ```bash
   npm test
   ```

## 📝 Development Workflow

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the code style guidelines below
   - Add tests for new functionality
   - Update documentation as needed

3. **Run tests and linting**
   ```bash
   npm run test
   npm run lint
   npm run format:check
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: Add your feature description"
   ```

   Use conventional commits format:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `test:` - Test additions or changes
   - `refactor:` - Code refactoring
   - `chore:` - Build or tooling changes

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request**
   - Provide a clear description of the changes
   - Reference any related issues
   - Ensure CI checks pass

## 🧪 Testing Guidelines

### Writing Tests

- **Unit Tests**: Test individual modules in isolation
  - Place in `tests/unit/modules/` or `tests/unit/core/`
  - Mock external dependencies
  - Aim for 80%+ coverage

- **Integration Tests**: Test module interactions
  - Place in `tests/integration/`
  - Use real CDK synthesis when possible
  - Test with actual AWS constructs (mocked AWS calls)

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- storage.test.ts

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

## 📐 Code Style Guidelines

### TypeScript

- Use strict TypeScript mode
- Avoid `any` types - use proper types or interfaces
- Export types and interfaces from module index files
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### AWS CDK Constructs

- Follow AWS CDK best practices
- Use Lattice naming conventions (`Lattice*`)
- Apply security by default
- Support environment-specific configuration
- Use aspects for cross-cutting concerns

### File Organization

```
src/
├── core/              # Core framework code
├── modules/           # Infrastructure modules
│   └── <module>/
│       ├── index.ts   # Module exports
│       ├── lattice-<module>.ts  # Main construct
│       └── types.ts   # Type definitions
└── utils/             # Shared utilities
```

## 🔒 Security Guidelines

- **Never commit secrets** or AWS credentials
- **Enable encryption by default** for all data storage
- **Follow least privilege** for IAM policies
- **Validate all inputs** from external sources
- **Add security tests** for sensitive operations

## 📚 Documentation Guidelines

### Code Documentation

- Add JSDoc comments to all public classes and methods
- Include parameter descriptions and return types
- Provide usage examples in comments
- Document any security considerations

### User Documentation

- Update relevant docs in `docs/external/` for user-facing changes
- Add examples to `examples/` directory
- Update README if adding major features
- Keep docs clear and concise

### Internal Documentation

- Update `docs/internal/` for strategy or architecture changes
- Document design decisions and trade-offs
- Keep testing strategy up-to-date

## 🐛 Reporting Bugs

When reporting bugs, please include:

1. **Clear description** of the issue
2. **Steps to reproduce** the problem
3. **Expected behavior** vs actual behavior
4. **Environment details**:
   - Node.js version
   - AWS CDK version
   - Operating system
5. **Code samples** or error messages
6. **Relevant logs** (redact sensitive information)

## 💡 Suggesting Features

When suggesting features:

1. **Describe the use case** and problem being solved
2. **Explain the proposed solution** with examples
3. **Consider alternatives** and trade-offs
4. **Check existing issues** to avoid duplicates

## 🔄 Pull Request Process

1. **Ensure all tests pass** and coverage meets requirements
2. **Update documentation** for any user-facing changes
3. **Add examples** if introducing new features
4. **Request review** from maintainers
5. **Address review feedback** promptly
6. **Squash commits** if requested before merge

### PR Review Criteria

- ✅ Code follows style guidelines
- ✅ Tests added and passing
- ✅ Documentation updated
- ✅ No breaking changes (or properly documented)
- ✅ Security best practices followed
- ✅ Performance impact considered

## 📦 Release Process

Releases are managed by maintainers:

1. Version bump following semantic versioning
2. Update CHANGELOG.md
3. Tag release in git
4. Publish to npm registry
5. Update GitHub release notes

## 🤝 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them succeed
- Assume good intentions
- Provide constructive feedback
- Focus on what's best for the community

## 📄 License

By contributing, you agree that your contributions will be licensed under the Apache 2.0 License.

## ❓ Questions?

- Open a GitHub Issue for questions about contributing
- Check existing documentation in `docs/`
- Review examples in `examples/` directory

Thank you for contributing to Lattice AWS CDK! 🎉
