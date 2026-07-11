import { describe, expect, it } from "vitest";
import { parseFoodSegment, splitFoodText } from "@/lib/food-parser/tokenizer";
import { parseQuantityToken } from "@/lib/food-parser/numberWords";

describe("parseQuantityToken", () => {
  it("parses plain numbers", () => {
    expect(parseQuantityToken("3")).toBe(3);
    expect(parseQuantityToken("150")).toBe(150);
    expect(parseQuantityToken("1.5")).toBe(1.5);
  });
  it("parses number words", () => {
    expect(parseQuantityToken("one")).toBe(1);
    expect(parseQuantityToken("a")).toBe(1);
    expect(parseQuantityToken("half")).toBe(0.5);
    expect(parseQuantityToken("dozen")).toBe(12);
  });
  it("parses fractions", () => {
    expect(parseQuantityToken("1/2")).toBe(0.5);
    expect(parseQuantityToken("3/4")).toBe(0.75);
  });
  it("returns null for non-numeric words", () => {
    expect(parseQuantityToken("chicken")).toBeNull();
  });
});

describe("splitFoodText", () => {
  it("splits on commas, 'and', 'with', and line breaks", () => {
    expect(splitFoodText("150 g grilled chicken, 1 katori dal and 1 cup rice")).toEqual([
      "150 g grilled chicken",
      "1 katori dal",
      "1 cup rice",
    ]);
  });

  it("splits '3 eggs bhurji with 2 rotis' into two segments", () => {
    expect(splitFoodText("3 eggs bhurji with 2 rotis")).toEqual(["3 eggs bhurji", "2 rotis"]);
  });

  it("does not split words containing 'and' as a substring, e.g. 'sandwich'", () => {
    expect(splitFoodText("1 chicken sandwich")).toEqual(["1 chicken sandwich"]);
  });

  it("splits across line breaks", () => {
    expect(splitFoodText("2 idli with sambar\n1 cup coffee")).toEqual(["2 idli", "sambar", "1 cup coffee"]);
  });
});

describe("parseFoodSegment", () => {
  it("parses '3 eggs bhurji' as quantity 3, unit piece, query 'eggs bhurji'", () => {
    const result = parseFoodSegment("3 eggs bhurji");
    expect(result.quantityValue).toBe(3);
    expect(result.unit).toBe("piece");
    expect(result.foodQuery).toBe("eggs bhurji");
  });

  it("parses '2 rotis' keeping roti as both unit and food name", () => {
    const result = parseFoodSegment("2 rotis");
    expect(result.quantityValue).toBe(2);
    expect(result.unit).toBe("roti");
    expect(result.foodQuery.toLowerCase()).toContain("roti");
  });

  it("parses '1 cup chicken biryani'", () => {
    const result = parseFoodSegment("1 cup chicken biryani");
    expect(result.quantityValue).toBe(1);
    expect(result.unit).toBe("cup");
    expect(result.foodQuery).toBe("chicken biryani");
  });

  it("parses '100 g raita'", () => {
    const result = parseFoodSegment("100 g raita");
    expect(result.quantityValue).toBe(100);
    expect(result.unit).toBe("gram");
    expect(result.foodQuery).toBe("raita");
  });

  it("parses '1 katori dal'", () => {
    const result = parseFoodSegment("1 katori dal");
    expect(result.unit).toBe("katori");
    expect(result.foodQuery).toBe("dal");
  });

  it("parses '2 idli' with no explicit unit word as piece-based", () => {
    const result = parseFoodSegment("2 idli");
    expect(result.quantityValue).toBe(2);
    expect(result.unit).toBe("piece");
    expect(result.foodQuery).toBe("idli");
  });

  it("parses '200 g fish curry'", () => {
    const result = parseFoodSegment("200 g fish curry");
    expect(result.unit).toBe("gram");
    expect(result.foodQuery).toBe("fish curry");
  });

  it("parses '2 chapati'", () => {
    const result = parseFoodSegment("2 chapati");
    expect(result.unit).toBe("chapati");
  });

  it("parses 'One banana' with number words", () => {
    const result = parseFoodSegment("One banana");
    expect(result.quantityValue).toBe(1);
    expect(result.foodQuery).toBe("banana");
  });

  it("parses 'one scoop whey'", () => {
    const result = parseFoodSegment("one scoop whey");
    expect(result.quantityValue).toBe(1);
    expect(result.unit).toBe("scoop");
    expect(result.foodQuery).toBe("whey");
  });

  it("parses '250 ml tea'", () => {
    const result = parseFoodSegment("250 ml tea");
    expect(result.quantityValue).toBe(250);
    expect(result.unit).toBe("millilitre");
    expect(result.foodQuery).toBe("tea");
  });

  it("parses 'one teaspoon sugar'", () => {
    const result = parseFoodSegment("one teaspoon sugar");
    expect(result.unit).toBe("teaspoon");
    expect(result.foodQuery).toBe("sugar");
  });

  it("defaults to quantity 1 / serving when no quantity is present at all", () => {
    const result = parseFoodSegment("sambar");
    expect(result.quantityValue).toBe(1);
    expect(result.unit).toBe("serving");
    expect(result.foodQuery).toBe("sambar");
  });
});
