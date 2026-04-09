import { describe, expect, test } from "bun:test";
import { encodeMovesForReplayQuery, parseMovesFromReplayParam } from "./replay-url-codec";

describe("replay-url-codec", () => {
  test("compact round-trip", () => {
    const moves = [3, 3, 3, 2, 2, 4, 1, 0, 6];
    const enc = encodeMovesForReplayQuery(moves);
    expect(enc).toBe("333224106");
    expect(parseMovesFromReplayParam(enc)).toEqual(moves);
  });

  test("legacy comma form", () => {
    expect(parseMovesFromReplayParam("3, 3, 3")).toEqual([3, 3, 3]);
  });

  test("empty", () => {
    expect(parseMovesFromReplayParam("")).toEqual([]);
    expect(parseMovesFromReplayParam(undefined)).toEqual([]);
  });

  test("reject digit 7 in compact", () => {
    expect(parseMovesFromReplayParam("37")).toBeNull();
  });

  test("reject comma garbage", () => {
    expect(parseMovesFromReplayParam("3,12")).toBeNull();
  });
});
