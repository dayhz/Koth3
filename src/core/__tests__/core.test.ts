import { describe, it, expect } from 'vitest';
import { Vector2D } from '../math/Vector2D';
import { LinearCurve, CubicBezierCurve, ArcCurve } from '../curves/Curve';
import { CurveOffset } from '../curves/CurveOffset';
import { Polygon2D } from '../polygon/Polygon2D';
import { LineIntersection } from '../polygon/LineIntersection';
import { PRNG } from '../seed/PRNG';

describe('Core Math & Primitives', () => {
  it('Vector2D operations: norm, dot, cross, angles, normal vectors', () => {
    const v1 = new Vector2D(3, 4);
    expect(v1.length()).toBe(5);

    const norm = v1.normalize();
    expect(norm.length()).toBeCloseTo(1);

    const normalL = v1.normalLeft();
    expect(normalL.dot(v1)).toBeCloseTo(0);
    expect(normalL.x).toBeCloseTo(-4 / 5);
    expect(normalL.y).toBeCloseTo(3 / 5);

    const normalR = v1.normalRight();
    expect(normalR.dot(v1)).toBeCloseTo(0);
    expect(normalR.x).toBeCloseTo(4 / 5);
    expect(normalR.y).toBeCloseTo(-3 / 5);
  });

  it('LinearCurve evaluation and sampling', () => {
    const line = new LinearCurve(new Vector2D(0, 0), new Vector2D(10, 0));
    expect(line.getLength()).toBe(10);
    expect(line.getPoint(0.5).x).toBe(5);
    expect(line.getPoint(0.5).y).toBe(0);

    const normal = line.getNormal(0.5);
    expect(normal.x).toBeCloseTo(0);
    expect(normal.y).toBeCloseTo(1);
  });

  it('CubicBezierCurve evaluation and length', () => {
    const p0 = new Vector2D(0, 0);
    const p1 = new Vector2D(0, 10);
    const p2 = new Vector2D(10, 10);
    const p3 = new Vector2D(10, 0);
    const bezier = new CubicBezierCurve(p0, p1, p2, p3);

    expect(bezier.getPoint(0).equals(p0)).toBe(true);
    expect(bezier.getPoint(1).equals(p3)).toBe(true);
    expect(bezier.getLength()).toBeGreaterThan(10);

    const frames = bezier.sampleFrames(10);
    expect(frames.length).toBe(10);
  });

  it('ArcCurve evaluation and length', () => {
    const arc = new ArcCurve(new Vector2D(0, 0), 10, 0, Math.PI / 2, false);
    expect(arc.getLength()).toBeCloseTo(10 * (Math.PI / 2));
    expect(arc.getPoint(0).x).toBeCloseTo(10);
    expect(arc.getPoint(0).y).toBeCloseTo(0);
    expect(arc.getPoint(1).x).toBeCloseTo(0);
    expect(arc.getPoint(1).y).toBeCloseTo(10);
  });

  it('CurveOffset generates parallel sampled lines without NaN', () => {
    const line = new LinearCurve(new Vector2D(0, 0), new Vector2D(0, 20));
    const offsetPts = CurveOffset.sampleOffsetPoints(line, 3.5, 5);
    expect(offsetPts.length).toBe(5);
    expect(offsetPts[0].x).toBeCloseTo(-3.5);
    expect(offsetPts[0].y).toBeCloseTo(0);
  });

  it('LineIntersection detects segment intersections', () => {
    const s1A = new Vector2D(0, 5);
    const s1B = new Vector2D(10, 5);
    const s2A = new Vector2D(5, 0);
    const s2B = new Vector2D(5, 10);

    const res = LineIntersection.segmentSegment(s1A, s1B, s2A, s2B);
    expect(res.intersects).toBe(true);
    expect(res.point?.x).toBeCloseTo(5);
    expect(res.point?.y).toBeCloseTo(5);
  });

  it('Polygon2D calculates area, centroid, and triangulates with Earcut', () => {
    const poly = new Polygon2D([
      new Vector2D(0, 0),
      new Vector2D(10, 0),
      new Vector2D(10, 10),
      new Vector2D(0, 10),
    ]);

    expect(poly.getArea()).toBeCloseTo(100);
    expect(poly.getCentroid().x).toBeCloseTo(5);
    expect(poly.getCentroid().y).toBeCloseTo(5);

    const { positions, indices } = poly.triangulate();
    expect(positions.length).toBe(8); // 4 vertices * 2 coords
    expect(indices.length).toBe(6); // 2 triangles * 3 indices
  });

  it('PRNG generates deterministic sequences with seed', () => {
    const prng1 = new PRNG(482915);
    const val1_a = prng1.next();
    const val1_b = prng1.next();

    const prng2 = new PRNG(482915);
    expect(prng2.next()).toBe(val1_a);
    expect(prng2.next()).toBe(val1_b);
  });
});
