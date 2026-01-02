import { describe, it, expect } from "bun:test";
import type { TodoItem, ToolResult } from "@/types/widgets";

/**
 * Test suite for TodoWidget data extraction logic
 *
 * Since we don't have @testing-library/react installed,
 * these tests verify the defensive data extraction logic
 * that will be added to TodoWidget.
 */

describe("TodoWidget data extraction logic", () => {
  // Helper function that mimics the extraction logic we'll add to TodoWidget
  function extractTodos(inputTodos: TodoItem[] | undefined, result?: ToolResult): TodoItem[] {
    let todos: TodoItem[] = [];

    // Ensure inputTodos is actually an array
    if (Array.isArray(inputTodos) && inputTodos.length > 0) {
      todos = inputTodos;
    } else if (result) {
      // Try to extract from result object
      if (typeof result === 'object' && Array.isArray((result as any).todos)) {
        todos = (result as any).todos;
      } else if (typeof (result as any).content === 'string') {
        try {
          const parsed = JSON.parse((result as any).content);
          if (Array.isArray(parsed)) {
            todos = parsed;
          } else if (parsed.todos && Array.isArray(parsed.todos)) {
            todos = parsed.todos;
          }
        } catch (e) {
          // Not JSON, ignore
        }
      }
    } else if (Array.isArray(inputTodos)) {
      // Empty array case - use it as is
      todos = inputTodos;
    }
    return todos;
  }

  describe("handles invalid todos prop", () => {
    it("should return empty array when todos is undefined", () => {
      const result = extractTodos(undefined);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it("should return empty array when todos is undefined and result is undefined", () => {
      const result = extractTodos(undefined, undefined);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe("extracts todos from result object", () => {
    const mockTodos: TodoItem[] = [
      { content: "Test todo 1", activeForm: "Testing todo 1", status: "pending" },
      { content: "Test todo 2", activeForm: "Testing todo 2", status: "completed" }
    ];

    it("should extract todos from result.todos when input is undefined", () => {
      const result = { todos: mockTodos };
      const extracted = extractTodos(undefined, result);
      expect(extracted.length).toBe(2);
      expect(extracted[0].content).toBe("Test todo 1");
    });

    it("should extract todos from nested JSON structure in result.content", () => {
      const result = {
        content: JSON.stringify({ todos: mockTodos })
      };
      const extracted = extractTodos(undefined, result);
      expect(extracted.length).toBe(2);
      expect(extracted[0].content).toBe("Test todo 1");
    });

    it("should parse direct array from result.content", () => {
      const result = {
        content: JSON.stringify(mockTodos)
      };
      const extracted = extractTodos(undefined, result);
      expect(extracted.length).toBe(2);
    });

    it("should handle invalid JSON gracefully", () => {
      const result = {
        content: "not valid json {"
      };
      expect(() => extractTodos(undefined, result)).not.toThrow();
      const extracted = extractTodos(undefined, result);
      expect(extracted.length).toBe(0);
    });

    it("should prioritize input todos over result", () => {
      const inputTodos: TodoItem[] = [
        { content: "Input todo", activeForm: "Input", status: "pending" }
      ];
      const result = { todos: mockTodos };
      const extracted = extractTodos(inputTodos, result);
      expect(extracted.length).toBe(1);
      expect(extracted[0].content).toBe("Input todo");
    });
  });

  describe("handles empty states", () => {
    it("should return empty array when todos is empty array", () => {
      const result = extractTodos([]);
      expect(result.length).toBe(0);
    });

    it("should try to extract from result when input is empty array", () => {
      const mockTodos: TodoItem[] = [
        { content: "From result", activeForm: "From result", status: "pending" }
      ];
      const result = { todos: mockTodos };
      const extracted = extractTodos([], result);
      expect(extracted.length).toBe(1);
      expect(extracted[0].content).toBe("From result");
    });
  });

  describe("validates data types", () => {
    it("should handle result with non-array todos property", () => {
      const result = { todos: "not an array" };
      const extracted = extractTodos(undefined, result);
      expect(extracted.length).toBe(0);
    });

    it("should handle result with non-string content", () => {
      const result = { content: 123 };
      const extracted = extractTodos(undefined, result);
      expect(extracted.length).toBe(0);
    });

    it("should handle result that is not an object", () => {
      const result = "string result" as any;
      expect(() => extractTodos(undefined, result)).not.toThrow();
    });
  });
});
