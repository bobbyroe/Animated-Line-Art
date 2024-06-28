import { BufferAttribute, BufferGeometry, Vector3 } from 'three';
const itemSize = 6;
export class MeshLineGeometry extends BufferGeometry {
    isMeshLineGeometry = true;
    type = 'MeshLineGeometry';
    #positions = new Float32Array();
    #previous = new Float32Array();
    #next = new Float32Array();
    #side = new Float32Array();
    #width = new Float32Array();
    #uvs = new Float32Array();
    #indices = new Uint16Array();
    #counters = new Float32Array();
    widthCallback = null;
    #attributes = null;
    #points = [];
    get points() {
        return this.#points;
    }
    set points(value) {
        this.setPoints(value, this.widthCallback);
    }
    #previousWidthCallback = null;
    #previousPointCount = 0;
    #pointCount = 0;
    setPoints(points, widthCallback = null, updateBounds = true) {
        this.#points = points;
        this.#previousWidthCallback = this.widthCallback;
        this.widthCallback = widthCallback;
        if (!('length' in points)) {
            throw new Error('not a Vector3 Array, or not a number Array or Float32Array with 3 numbers per point');
        }
        if (!points.length) {
            this.dispose();
            this.#pointCount = 0;
            this.#previousPointCount = 0;
            return;
        }
        const isVector3Arr = isVector3Array(points);
        if (isVector3Arr) {
            this.#pointCount = points.length;
        }
        else {
            if (points.length % 3 !== 0)
                throw new Error('The array should consist of number triplets, 3 number per point.');
            this.#pointCount = points.length / 3;
        }
        const pointCount = this.#pointCount;
        const sizeChanged = this.#previousPointCount !== pointCount;
        const wcbChanged = this.#previousWidthCallback !== this.widthCallback;
        if (!this.#attributes || sizeChanged) {
            this.#makeNewBuffers(pointCount);
        }
        this.#previousPointCount = pointCount;
        let width;
        let x = 0;
        let y = 0;
        let z = 0;
        let positionIndex = 0;
        let counterIndex = 0;
        let previousIndex = 0;
        let nextIndex = 0;
        let sideIndex = 0;
        let widthIndex = 0;
        let indicesIndex = 0;
        let uvsIndex = 0;
        if (isVector3Arr) {
            for (let j = 0; j < points.length; j++) {
                const p = points[j];
                if (!p)
                    throw new Error('point missing');
                ({ x, y, z } = p);
                setXYZXYZ(this.#positions, positionIndex, x, y, z);
                positionIndex += itemSize;
                const c = j / points.length;
                this.#counters[counterIndex + 0] = c;
                this.#counters[counterIndex + 1] = c;
                counterIndex += 2;
            }
        }
        else {
            for (let j = 0; j < points.length; j += 3) {
                const x = points[j + 0];
                const y = points[j + 1];
                const z = points[j + 2];
                if (x == null || y == null || z == null)
                    throw new Error('point missing');
                setXYZXYZ(this.#positions, positionIndex, x, y, z);
                positionIndex += itemSize;
                const c = j / points.length;
                this.#counters[counterIndex + 0] = c;
                this.#counters[counterIndex + 1] = c;
                counterIndex += 2;
            }
        }
        let getIndex = 0;
        if (this.#pointsAreEqual(0, pointCount - 1)) {
            getIndex = (pointCount - 2) * itemSize;
            x = this.#positions[getIndex + 0];
            y = this.#positions[getIndex + 1];
            z = this.#positions[getIndex + 2];
        }
        else {
            getIndex = 0;
            x = this.#positions[getIndex + 0];
            y = this.#positions[getIndex + 1];
            z = this.#positions[getIndex + 2];
        }
        if (x == null || y == null || z == null)
            throw new Error('point missing');
        setXYZXYZ(this.#previous, previousIndex, x, y, z);
        previousIndex += 6;
        for (let j = 0; j < pointCount; j++) {
            if (sizeChanged) {
                setXY(this.#side, sideIndex, 1, -1);
                sideIndex += 2;
            }
            if (wcbChanged || sizeChanged) {
                if (this.widthCallback)
                    width = this.widthCallback(j / (pointCount - 1));
                else
                    width = 1;
                setXY(this.#width, widthIndex, width, width);
                widthIndex += 2;
            }
            if (sizeChanged) {
                setXYZW(this.#uvs, uvsIndex, j / (pointCount - 1), 0, j / (pointCount - 1), 1);
                uvsIndex += 4;
            }
            if (j < pointCount - 1) {
                getIndex = j * itemSize;
                x = this.#positions[getIndex + 0];
                y = this.#positions[getIndex + 1];
                z = this.#positions[getIndex + 2];
                if (x == null || y == null || z == null)
                    throw new Error('point missing');
                setXYZXYZ(this.#previous, previousIndex, x, y, z);
                previousIndex += 6;
                if (sizeChanged) {
                    const n = j * 2;
                    setXYZ(this.#indices, indicesIndex, n + 0, n + 1, n + 2);
                    setXYZ(this.#indices, indicesIndex + 3, n + 2, n + 1, n + 3);
                    indicesIndex += 6;
                }
            }
            if (j > 0) {
                getIndex = j * itemSize;
                x = this.#positions[getIndex + 0];
                y = this.#positions[getIndex + 1];
                z = this.#positions[getIndex + 2];
                if (x == null || y == null || z == null)
                    throw new Error('point missing');
                setXYZXYZ(this.#next, nextIndex, x, y, z);
                nextIndex += 6;
            }
        }
        if (this.#pointsAreEqual(pointCount - 1, 0)) {
            getIndex = 1 * itemSize;
            x = this.#positions[getIndex + 0];
            y = this.#positions[getIndex + 1];
            z = this.#positions[getIndex + 2];
        }
        else {
            getIndex = (pointCount - 1) * itemSize;
            x = this.#positions[getIndex + 0];
            y = this.#positions[getIndex + 1];
            z = this.#positions[getIndex + 2];
        }
        if (x == null || y == null || z == null)
            throw new Error('point missing');
        setXYZXYZ(this.#next, nextIndex, x, y, z);
        if (!this.#attributes)
            throw new Error('missing attributes');
        this.#attributes.position.needsUpdate = true;
        this.#attributes.previous.needsUpdate = true;
        this.#attributes.next.needsUpdate = true;
        this.#attributes.side.needsUpdate = sizeChanged;
        this.#attributes.width.needsUpdate = sizeChanged;
        this.#attributes.uv.needsUpdate = sizeChanged;
        this.#attributes.index.needsUpdate = sizeChanged;
        if (updateBounds) {
            this.computeBoundingSphere();
            this.computeBoundingBox();
        }
    }
    #makeNewBuffers(pointCount) {
        this.dispose();
        this.#attributes = {
            position: new BufferAttribute((this.#positions = new Float32Array(pointCount * itemSize)), 3),
            previous: new BufferAttribute((this.#previous = new Float32Array(pointCount * itemSize)), 3),
            next: new BufferAttribute((this.#next = new Float32Array(pointCount * itemSize)), 3),
            side: new BufferAttribute((this.#side = new Float32Array(pointCount * 2)), 1),
            width: new BufferAttribute((this.#width = new Float32Array(pointCount * 2)), 1),
            uv: new BufferAttribute((this.#uvs = new Float32Array(pointCount * 4)), 2),
            counters: new BufferAttribute((this.#counters = new Float32Array(pointCount * 2)), 1),
            index: new BufferAttribute((this.#indices = new Uint16Array((pointCount - 1) * itemSize)), 1),
        };
        this.setAttribute('position', this.#attributes.position);
        this.setAttribute('previous', this.#attributes.previous);
        this.setAttribute('next', this.#attributes.next);
        this.setAttribute('side', this.#attributes.side);
        this.setAttribute('width', this.#attributes.width);
        this.setAttribute('uv', this.#attributes.uv);
        this.setAttribute('counters', this.#attributes.counters);
        this.setIndex(this.#attributes.index);
    }
    #pointsAreEqual(pointIndexA, pointIndexB) {
        const actualIndexA = pointIndexA * itemSize;
        const actualIndexB = pointIndexB * itemSize;
        return (this.#positions[actualIndexA + 0] === this.#positions[actualIndexB + 0] &&
            this.#positions[actualIndexA + 1] === this.#positions[actualIndexB + 1] &&
            this.#positions[actualIndexA + 2] === this.#positions[actualIndexB + 2]);
    }
    advance(position) {
        if (!this.#attributes)
            throw new Error('Call setPoints first.');
        const positions = this.#attributes.position.array;
        const previous = this.#attributes.previous.array;
        const next = this.#attributes.next.array;
        const l = positions.length;
        memcpy(positions, 0, previous, 0, l);
        memcpy(positions, itemSize, positions, 0, l - itemSize);
        positions[l - 6] = position.x;
        positions[l - 5] = position.y;
        positions[l - 4] = position.z;
        positions[l - 3] = position.x;
        positions[l - 2] = position.y;
        positions[l - 1] = position.z;
        memcpy(positions, itemSize, next, 0, l - itemSize);
        next[l - 6] = position.x;
        next[l - 5] = position.y;
        next[l - 4] = position.z;
        next[l - 3] = position.x;
        next[l - 2] = position.y;
        next[l - 1] = position.z;
        this.#attributes.position.needsUpdate = true;
        this.#attributes.previous.needsUpdate = true;
        this.#attributes.next.needsUpdate = true;
    }
}
function isVector3Array(array) {
    return !!(array.length && array[0] instanceof Vector3);
}
function memcpy(src, srcBegin, dst, dstOffset, srcLength) {
    if (dstOffset + srcLength > dst.length)
        throw new Error('Not enough space to copy from src to dst.');
    for (let i = 0, srcEnd = srcBegin + srcLength; i + srcBegin < srcEnd; i++) {
        const srcValue = src[i + srcBegin];
        if (srcValue == null)
            throw new Error('missing src value');
        dst[i + dstOffset] = srcValue;
    }
}
function setXY(array, location, x, y) {
    array[location + 0] = x;
    array[location + 1] = y;
}
function setXYZ(array, location, x, y, z) {
    array[location + 0] = x;
    array[location + 1] = y;
    array[location + 2] = z;
}
function setXYZXYZ(array, location, x, y, z) {
    array[location + 0] = x;
    array[location + 1] = y;
    array[location + 2] = z;
    array[location + 3] = x;
    array[location + 4] = y;
    array[location + 5] = z;
}
function setXYZW(array, location, x, y, z, w) {
    array[location + 0] = x;
    array[location + 1] = y;
    array[location + 2] = z;
    array[location + 3] = w;
}
//# sourceMappingURL=MeshLineGeometry.js.map