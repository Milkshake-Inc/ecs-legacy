// https://gist.github.com/donmccurdy/323c6363ac7ca8a7de6a3362d7fdddb4
import {
	TrianglesDrawMode,
	DefaultLoadingManager,
	FileLoader,
	Float32BufferAttribute,
	Int8BufferAttribute,
	Int16BufferAttribute,
	Int32BufferAttribute,
	Uint8BufferAttribute,
	Uint16BufferAttribute,
	Uint32BufferAttribute,
	BufferGeometry,
	TriangleStripDrawMode
} from 'three';

const decoder = require('draco3dgltf').createDecoderModule();

export default class NodeDracoLoader {
	protected timeLoaded = 0;
	protected manager;
	protected materials;
	protected verbosity;
	protected attributeOptions;
	protected drawMode;
	protected nativeAttributeMap;
	protected path;

	constructor(manager) {
		this.timeLoaded = 0;
		this.manager = manager || DefaultLoadingManager;
		this.materials = null;
		this.verbosity = 0;
		this.attributeOptions = {};
		this.drawMode = TrianglesDrawMode;
		// Native Draco attribute type to Three.JS attribute type.
		this.nativeAttributeMap = {
			position: 'POSITION',
			normal: 'NORMAL',
			color: 'COLOR',
			uv: 'TEX_COORD'
		};
	}

	load(url, onLoad, onProgress, onError) {
		const loader = new FileLoader(this.manager);
		loader.setPath(this.path);
		loader.setResponseType('arraybuffer');
		loader.load(
			url,
			blob => {
				this.decodeDracoFile(blob, onLoad);
			},
			onProgress,
			onError
		);
	}

	setPath(value) {
		this.path = value;
		return this;
	}

	setVerbosity(level) {
		this.verbosity = level;
		return this;
	}

	setDrawMode(drawMode) {
		this.drawMode = drawMode;
		return this;
	}

	/**
	 * Skips dequantization for a specific attribute.
	 * |attributeName| is the THREE.js name of the given attribute type.
	 * The only currently supported |attributeName| is 'position', more may be
	 * added in future.
	 */
	setSkipDequantization(attributeName, skip) {
		let skipDequantization = true;
		if (typeof skip !== 'undefined') skipDequantization = skip;
		this.getAttributeOptions(attributeName).skipDequantization = skipDequantization;
		return this;
	}

	/**
	 * Decompresses a Draco buffer. Names of attributes (for ID and type maps)
	 * must be one of the supported three.js types, including: position, color,
	 * normal, uv, uv2, skinIndex, skinWeight.
	 *
	 * @param {ArrayBuffer} rawBuffer
	 * @param callback
	 * @param {Object|undefined} attributeUniqueIdMap Provides a pre-defined ID
	 *     for each attribute in the geometry to be decoded. If given,
	 *     `attributeTypeMap` is required and `nativeAttributeMap` will be
	 *     ignored.
	 * @param {Object|undefined} attributeTypeMap Provides a predefined data
	 *     type (as a typed array constructor) for each attribute in the
	 *     geometry to be decoded.
	 */
	decodeDracoFile(rawBuffer, callback, attributeUniqueIdMap = undefined, attributeTypeMap = undefined) {
		this.decodeDracoFileInternal(rawBuffer, decoder, callback, attributeUniqueIdMap, attributeTypeMap);
	}

	decodeDracoFileInternal(rawBuffer, dracoDecoder, callback, attributeUniqueIdMap, attributeTypeMap) {
		/*
		 * Here is how to use Draco Javascript decoder and get the geometry.
		 */
		const buffer = new dracoDecoder.DecoderBuffer();
		buffer.Init(new Int8Array(rawBuffer), rawBuffer.byteLength);
		const decoder = new dracoDecoder.Decoder();

		/*
		 * Determine what type is this file: mesh or point cloud.
		 */
		const geometryType = decoder.GetEncodedGeometryType(buffer);
		if (geometryType == dracoDecoder.TRIANGULAR_MESH) {
			if (this.verbosity > 0) {
				console.log('Loaded a mesh.');
			}
		} else if (geometryType == dracoDecoder.POINT_CLOUD) {
			if (this.verbosity > 0) {
				console.log('Loaded a point cloud.');
			}
		} else {
			const errorMsg = 'THREE.DRACOLoader: Unknown geometry type.';
			console.error(errorMsg);
			throw new Error(errorMsg);
		}
		callback(this.convertDracoGeometryTo3JS(dracoDecoder, decoder, geometryType, buffer, attributeUniqueIdMap, attributeTypeMap));
	}

	addAttributeToGeometry(dracoDecoder, decoder, dracoGeometry, attributeName, attributeType, attribute, geometry, geometryBuffer) {
		if (attribute.ptr === 0) {
			const errorMsg = 'THREE.DRACOLoader: No attribute ' + attributeName;
			console.error(errorMsg);
			throw new Error(errorMsg);
		}

		const numComponents = attribute.num_components();
		const numPoints = dracoGeometry.num_points();
		const numValues = numPoints * numComponents;
		let attributeData;
		let TypedBufferAttribute;

		switch (attributeType) {
			case Float32Array:
				attributeData = new dracoDecoder.DracoFloat32Array();
				decoder.GetAttributeFloatForAllPoints(dracoGeometry, attribute, attributeData);
				geometryBuffer[attributeName] = new Float32Array(numValues);
				TypedBufferAttribute = Float32BufferAttribute;
				break;

			case Int8Array:
				attributeData = new dracoDecoder.DracoInt8Array();
				decoder.GetAttributeInt8ForAllPoints(dracoGeometry, attribute, attributeData);
				geometryBuffer[attributeName] = new Int8Array(numValues);
				TypedBufferAttribute = Int8BufferAttribute;
				break;

			case Int16Array:
				attributeData = new dracoDecoder.DracoInt16Array();
				decoder.GetAttributeInt16ForAllPoints(dracoGeometry, attribute, attributeData);
				geometryBuffer[attributeName] = new Int16Array(numValues);
				TypedBufferAttribute = Int16BufferAttribute;
				break;

			case Int32Array:
				attributeData = new dracoDecoder.DracoInt32Array();
				decoder.GetAttributeInt32ForAllPoints(dracoGeometry, attribute, attributeData);
				geometryBuffer[attributeName] = new Int32Array(numValues);
				TypedBufferAttribute = Int32BufferAttribute;
				break;

			case Uint8Array:
				attributeData = new dracoDecoder.DracoUInt8Array();
				decoder.GetAttributeUInt8ForAllPoints(dracoGeometry, attribute, attributeData);
				geometryBuffer[attributeName] = new Uint8Array(numValues);
				TypedBufferAttribute = Uint8BufferAttribute;
				break;

			case Uint16Array:
				attributeData = new dracoDecoder.DracoUInt16Array();
				decoder.GetAttributeUInt16ForAllPoints(dracoGeometry, attribute, attributeData);
				geometryBuffer[attributeName] = new Uint16Array(numValues);
				TypedBufferAttribute = Uint16BufferAttribute;
				break;

			case Uint32Array:
				attributeData = new dracoDecoder.DracoUInt32Array();
				decoder.GetAttributeUInt32ForAllPoints(dracoGeometry, attribute, attributeData);
				geometryBuffer[attributeName] = new Uint32Array(numValues);
				TypedBufferAttribute = Uint32BufferAttribute;
				break;

			default:
				// eslint-disable-next-line no-case-declarations
				const errorMsg = 'THREE.DRACOLoader: Unexpected attribute type.';
				console.error(errorMsg);
				throw new Error(errorMsg);
		}

		// Copy data from decoder.
		for (let i = 0; i < numValues; i++) {
			geometryBuffer[attributeName][i] = attributeData.GetValue(i);
		}
		// Add attribute to THREEJS geometry for rendering.
		geometry.addAttribute(attributeName, new TypedBufferAttribute(geometryBuffer[attributeName], numComponents));
		dracoDecoder.destroy(attributeData);
	}

	convertDracoGeometryTo3JS(dracoDecoder, decoder, geometryType, buffer, attributeUniqueIdMap, attributeTypeMap) {
		// TODO: Should not assume native Draco attribute IDs apply.
		if (this.getAttributeOptions('position').skipDequantization === true) {
			decoder.SkipAttributeTransform(dracoDecoder.POSITION);
		}
		let dracoGeometry;
		let decodingStatus;
		// var start_time = performance.now();
		if (geometryType === dracoDecoder.TRIANGULAR_MESH) {
			dracoGeometry = new dracoDecoder.Mesh();
			decodingStatus = decoder.DecodeBufferToMesh(buffer, dracoGeometry);
		} else {
			dracoGeometry = new dracoDecoder.PointCloud();
			decodingStatus = decoder.DecodeBufferToPointCloud(buffer, dracoGeometry);
		}
		if (!decodingStatus.ok() || dracoGeometry.ptr == 0) {
			let errorMsg = 'THREE.DRACOLoader: Decoding failed: ';
			errorMsg += decodingStatus.error_msg();
			console.error(errorMsg);
			dracoDecoder.destroy(decoder);
			dracoDecoder.destroy(dracoGeometry);
			throw new Error(errorMsg);
		}

		// var decode_end = performance.now();
		dracoDecoder.destroy(buffer);
		/*
		 * Example on how to retrieve mesh and attributes.
		 */
		let numFaces;
		if (geometryType == dracoDecoder.TRIANGULAR_MESH) {
			numFaces = dracoGeometry.num_faces();
			if (this.verbosity > 0) {
				console.log('Number of faces loaded: ' + numFaces.toString());
			}
		} else {
			numFaces = 0;
		}

		const numPoints = dracoGeometry.num_points();
		const numAttributes = dracoGeometry.num_attributes();
		if (this.verbosity > 0) {
			console.log('Number of points loaded: ' + numPoints.toString());
			console.log('Number of attributes loaded: ' + numAttributes.toString());
		}

		// Verify if there is position attribute.
		// TODO: Should not assume native Draco attribute IDs apply.
		const posAttId = decoder.GetAttributeId(dracoGeometry, dracoDecoder.POSITION);
		if (posAttId == -1) {
			const errorMsg = 'THREE.DRACOLoader: No position attribute found.';
			console.error(errorMsg);
			dracoDecoder.destroy(decoder);
			dracoDecoder.destroy(dracoGeometry);
			throw new Error(errorMsg);
		}
		const posAttribute = decoder.GetAttribute(dracoGeometry, posAttId);

		// Structure for converting to THREEJS geometry later.
		const geometryBuffer = {} as any;
		// Import data to Three JS geometry.
		const geometry = new BufferGeometry() as any;

		// Do not use both the native attribute map and a provided (e.g. glTF) map.
		if (attributeUniqueIdMap) {
			// Add attributes of user specified unique id. E.g. GLTF models.
			for (const attributeName in attributeUniqueIdMap) {
				const attributeType = attributeTypeMap[attributeName];
				const attributeId = attributeUniqueIdMap[attributeName];
				const attribute = decoder.GetAttributeByUniqueId(dracoGeometry, attributeId);
				this.addAttributeToGeometry(
					dracoDecoder,
					decoder,
					dracoGeometry,
					attributeName,
					attributeType,
					attribute,
					geometry,
					geometryBuffer
				);
			}
		} else {
			// Add native Draco attribute type to geometry.
			for (const attributeName in this.nativeAttributeMap) {
				const attId = decoder.GetAttributeId(dracoGeometry, dracoDecoder[this.nativeAttributeMap[attributeName]]);
				if (attId !== -1) {
					if (this.verbosity > 0) {
						console.log('Loaded ' + attributeName + ' attribute.');
					}
					const attribute = decoder.GetAttribute(dracoGeometry, attId);
					this.addAttributeToGeometry(
						dracoDecoder,
						decoder,
						dracoGeometry,
						attributeName,
						Float32Array,
						attribute,
						geometry,
						geometryBuffer
					);
				}
			}
		}

		// For mesh, we need to generate the faces.
		if (geometryType == dracoDecoder.TRIANGULAR_MESH) {
			if (this.drawMode === TriangleStripDrawMode) {
				const stripsArray = new dracoDecoder.DracoInt32Array();
				// const numStrips = decoder.GetTriangleStripsFromMesh(dracoGeometry, stripsArray);
				geometryBuffer.indices = new Uint32Array(stripsArray.size());
				for (let i = 0; i < stripsArray.size(); ++i) {
					geometryBuffer.indices[i] = stripsArray.GetValue(i);
				}
				dracoDecoder.destroy(stripsArray);
			} else {
				const numIndices = numFaces * 3;
				geometryBuffer.indices = new Uint32Array(numIndices);
				const ia = new dracoDecoder.DracoInt32Array();
				for (let i = 0; i < numFaces; ++i) {
					decoder.GetFaceFromMesh(dracoGeometry, i, ia);
					const index = i * 3;
					geometryBuffer.indices[index] = ia.GetValue(0);
					geometryBuffer.indices[index + 1] = ia.GetValue(1);
					geometryBuffer.indices[index + 2] = ia.GetValue(2);
				}
				dracoDecoder.destroy(ia);
			}
		}

		geometry.drawMode = this.drawMode;
		if (geometryType == dracoDecoder.TRIANGULAR_MESH) {
			geometry.setIndex(
				new (geometryBuffer.indices.length > 65535 ? Uint32BufferAttribute : Uint16BufferAttribute)(geometryBuffer.indices, 1)
			);
		}

		// TODO: Should not assume native Draco attribute IDs apply.
		// TODO: Can other attribute types be quantized?
		const posTransform = new dracoDecoder.AttributeQuantizationTransform();
		if (posTransform.InitFromAttribute(posAttribute)) {
			// Quantized attribute. Store the quantization parameters into the
			// THREE.js attribute.
			(geometry.attributes['position'] as any).isQuantized = true;
			(geometry.attributes['position'] as any).maxRange = posTransform.range();
			(geometry.attributes['position'] as any).numQuantizationBits = posTransform.quantization_bits();
			(geometry.attributes['position'] as any).minValues = new Float32Array(3);
			for (let i = 0; i < 3; ++i) {
				(geometry.attributes['position'] as any).minValues[i] = posTransform.min_value(i);
			}
		}
		dracoDecoder.destroy(posTransform);
		dracoDecoder.destroy(decoder);
		dracoDecoder.destroy(dracoGeometry);

		// this.decode_time = decode_end - start_time;
		// this.import_time = performance.now() - decode_end;

		// if (this.verbosity > 0) {
		//   console.log('Decode time: ' + this.decode_time);
		//   console.log('Import time: ' + this.import_time);
		// }
		return geometry;
	}

	isVersionSupported(version, callback) {
		callback(decoder.isVersionSupported(version));
	}

	getAttributeOptions(attributeName) {
		if (typeof this.attributeOptions[attributeName] === 'undefined') this.attributeOptions[attributeName] = {};
		return this.attributeOptions[attributeName];
	}
}
