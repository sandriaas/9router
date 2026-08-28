import { describe, expect, it } from "vitest";

import { openaiToOpenAIResponsesRequest } from "../../open-sse/translator/request/openai-responses.js";

const baseBody = {
  messages: [{ role: "user", content: "Hello" }],
};

describe("OpenAI Chat to Responses Captain compatibility", () => {
  it("maps JSON schema response_format to Responses text.format", () => {
    const schema = {
      type: "object",
      properties: { response: { type: "string" } },
      required: ["response"],
      additionalProperties: false,
    };

    const result = openaiToOpenAIResponsesRequest(
      "gpt-5.4-mini",
      {
        ...baseBody,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "captain_response",
            description: "Captain response payload",
            schema,
            strict: true,
          },
        },
      },
      true,
      null
    );

    expect(result.text).toEqual({
      format: {
        type: "json_schema",
        name: "captain_response",
        description: "Captain response payload",
        schema,
        strict: true,
      },
    });
    expect(result).not.toHaveProperty("response_format");
  });

  it("maps JSON object response_format to Responses text.format", () => {
    const result = openaiToOpenAIResponsesRequest(
      "gpt-5.4-mini",
      { ...baseBody, response_format: { type: "json_object" } },
      true,
      null
    );

    expect(result.text).toEqual({ format: { type: "json_object" } });
  });

  it("maps function tool_choice and preserves parallel_tool_calls", () => {
    const result = openaiToOpenAIResponsesRequest(
      "gpt-5.4-mini",
      {
        ...baseBody,
        tools: [
          {
            type: "function",
            function: {
              name: "search_documents",
              description: "Search documents",
              parameters: { type: "object", properties: {} },
            },
          },
        ],
        tool_choice: {
          type: "function",
          function: { name: "search_documents" },
        },
        parallel_tool_calls: false,
      },
      true,
      null
    );

    expect(result.tool_choice).toEqual({
      type: "function",
      name: "search_documents",
    });
    expect(result.parallel_tool_calls).toBe(false);
  });

  it.each(["none", "auto", "required"])(
    "preserves string tool_choice %s",
    toolChoice => {
      const result = openaiToOpenAIResponsesRequest(
        "gpt-5.4-mini",
        { ...baseBody, tool_choice: toolChoice },
        true,
        null
      );

      expect(result.tool_choice).toBe(toolChoice);
    }
  );

  it("maps max_tokens to max_output_tokens", () => {
    const result = openaiToOpenAIResponsesRequest(
      "gpt-5.4-mini",
      { ...baseBody, max_tokens: 2048 },
      true,
      null
    );

    expect(result.max_output_tokens).toBe(2048);
    expect(result).not.toHaveProperty("max_tokens");
  });
});
