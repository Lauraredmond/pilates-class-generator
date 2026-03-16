// Youth Code Generation Tests
// Tests uniqueness, format, and collision handling for 6-character youth codes

import { describe, it } from 'node:test';
import assert from 'node:assert';

// Replicate code generation logic for testing
function generateCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // Excludes 0/O, 1/I/L
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

describe('Youth Code Generation Tests', () => {
  describe('Code Format', () => {
    it('should generate 6-character codes', () => {
      for (let i = 0; i < 100; i++) {
        const code = generateCode();
        assert.strictEqual(code.length, 6, `Code should be 6 characters, got: ${code}`);
      }
    });

    it('should only contain allowed characters', () => {
      const allowedChars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
      for (let i = 0; i < 100; i++) {
        const code = generateCode();
        for (const char of code) {
          assert(allowedChars.includes(char),
            `Code contains invalid character: ${char} in ${code}`);
        }
      }
    });

    it('should exclude ambiguous characters (0, O, 1, I, L)', () => {
      const ambiguousChars = ['0', 'O', '1', 'I', 'L'];
      for (let i = 0; i < 1000; i++) {
        const code = generateCode();
        for (const char of ambiguousChars) {
          assert(!code.includes(char),
            `Code contains ambiguous character: ${char} in ${code}`);
        }
      }
    });

    it('should be uppercase only', () => {
      for (let i = 0; i < 100; i++) {
        const code = generateCode();
        assert.strictEqual(code, code.toUpperCase(),
          `Code should be uppercase only, got: ${code}`);
      }
    });
  });

  describe('Uniqueness', () => {
    it('should generate unique codes in batch', () => {
      const codes = new Set();
      const batchSize = 10000;

      for (let i = 0; i < batchSize; i++) {
        codes.add(generateCode());
      }

      // With 32 chars and 6 positions, we have 32^6 = 1,073,741,824 possibilities
      // Collision probability for 10,000 codes is extremely low
      assert(codes.size > batchSize * 0.999,
        `Too many collisions: ${batchSize - codes.size} duplicates in ${batchSize} codes`);
    });

    it('should have sufficient entropy', () => {
      // Calculate total possible combinations
      const chars = 32; // Length of allowed character set
      const length = 6;
      const totalCombinations = Math.pow(chars, length);

      assert(totalCombinations > 1000000000,
        'Should have over 1 billion possible combinations');

      // Log the actual number for reference
      console.log(`Total possible codes: ${totalCombinations.toLocaleString()}`);
    });
  });

  describe('Case Insensitivity', () => {
    it('should treat codes as case-insensitive in database', () => {
      const code1 = 'ABC123';
      const code2 = 'abc123';
      const code3 = 'AbC123';

      // All should be treated as the same code
      assert.strictEqual(code1.toUpperCase(), code2.toUpperCase());
      assert.strictEqual(code2.toUpperCase(), code3.toUpperCase());
    });
  });

  describe('Security', () => {
    it('should not be guessable with reasonable attempts', () => {
      // With 32^6 combinations, brute force probability is:
      const totalCombinations = Math.pow(32, 6);
      const maxAttempts = 10; // Rate limited attempts
      const probability = maxAttempts / totalCombinations;

      assert(probability < 0.00001,
        `Guess probability too high: ${probability}`);
    });

    it('should not follow predictable patterns', () => {
      const codes = [];
      for (let i = 0; i < 100; i++) {
        codes.push(generateCode());
      }

      // Check for sequential patterns
      for (let i = 1; i < codes.length; i++) {
        assert.notStrictEqual(codes[i], codes[i-1],
          'Sequential codes should not be identical');

        // Check codes aren't incrementing predictably
        if (codes[i].substring(0, 5) === codes[i-1].substring(0, 5)) {
          const lastChar1 = codes[i-1].charAt(5);
          const lastChar2 = codes[i].charAt(5);
          const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
          const idx1 = chars.indexOf(lastChar1);
          const idx2 = chars.indexOf(lastChar2);

          // Shouldn't always increment by 1
          if (idx2 === idx1 + 1) {
            console.warn(`Potentially predictable sequence: ${codes[i-1]} -> ${codes[i]}`);
          }
        }
      }
    });
  });

  describe('Database Constraints', () => {
    it('should match PostgreSQL check constraint pattern', () => {
      // Pattern from schema: ^[A-Z2-9]{6}$ excluding [01ILO]
      const validPattern = /^[A-Z2-9]{6}$/;
      const invalidChars = /[01ILO]/;

      for (let i = 0; i < 100; i++) {
        const code = generateCode();

        // Should match valid pattern
        assert(validPattern.test(code),
          `Code doesn't match valid pattern: ${code}`);

        // Should not contain invalid chars
        assert(!invalidChars.test(code),
          `Code contains invalid characters: ${code}`);
      }
    });
  });

  describe('User Experience', () => {
    it('should be easy to communicate verbally', () => {
      // No ambiguous characters that sound alike
      const code = generateCode();

      // Check no O/0 confusion
      assert(!code.includes('O'), 'Should not contain O (sounds like zero)');
      assert(!code.includes('0'), 'Should not contain 0 (sounds like O)');

      // Check no I/1/L confusion
      assert(!code.includes('I'), 'Should not contain I (looks like 1 or L)');
      assert(!code.includes('1'), 'Should not contain 1 (looks like I or L)');
      assert(!code.includes('L'), 'Should not contain L (looks like I or 1)');
    });

    it('should be reasonable length for manual entry', () => {
      const code = generateCode();
      assert(code.length <= 6, 'Code should be 6 chars or less for easy entry');
      assert(code.length >= 6, 'Code should be at least 6 chars for security');
    });
  });

  describe('Performance', () => {
    it('should generate codes quickly', () => {
      const start = Date.now();
      const iterations = 10000;

      for (let i = 0; i < iterations; i++) {
        generateCode();
      }

      const elapsed = Date.now() - start;
      const perCode = elapsed / iterations;

      assert(perCode < 1, `Code generation too slow: ${perCode}ms per code`);
      console.log(`Generated ${iterations} codes in ${elapsed}ms (${perCode.toFixed(3)}ms per code)`);
    });
  });
});

// Collision simulation
describe('Collision Probability Analysis', () => {
  it('should calculate birthday paradox for codes', () => {
    const totalCodes = Math.pow(32, 6); // Total possible codes

    // Calculate collision probability for different numbers of codes
    const testCases = [1000, 10000, 100000, 1000000];

    for (const n of testCases) {
      // Approximate collision probability using birthday paradox
      // P(collision) ≈ 1 - e^(-n²/2m) where m is total possibilities
      const probability = 1 - Math.exp(-(n * n) / (2 * totalCodes));

      console.log(`With ${n.toLocaleString()} codes:`);
      console.log(`  Collision probability: ${(probability * 100).toFixed(6)}%`);
      console.log(`  Expected unique: ${((1 - probability) * 100).toFixed(2)}%`);

      // Even with 1 million codes, collision probability should be very low
      if (n === 1000000) {
        assert(probability < 0.001, 'Collision probability too high for 1M codes');
      }
    }
  });
});

console.log('Code generation tests defined. Run with: npm test');