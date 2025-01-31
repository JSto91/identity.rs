export {};

const assert = require('assert');
const {
    CoreDID,
    CoreDocument,
    CoreService,
    CoreVerificationMethod,
    KeyType,
    MethodRelationship,
    MethodScope,
    MethodType,
} = require("../node");

const VALID_DID_KEY = "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK";
const VALID_DID_EXAMPLE = "did:example:123";
const KEY_BYTES = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32]);

describe('CoreDID', function () {
    describe('#parse', function () {
        it('iota', () => {
            let tag = "0x0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20";
            const didStr = "did:iota:smr:" + tag;
            const did = CoreDID.parse(didStr);
            assert.deepStrictEqual(did.toString(), didStr);
            assert.deepStrictEqual(did.method(), "iota");
            assert.deepStrictEqual(did.authority(), "iota:smr:" + tag);
            assert.deepStrictEqual(did.methodId(), "smr:" + tag);
            assert.deepStrictEqual(did.scheme(), "did");
        });
        it('key', () => {
            const tag = "z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK";
            const didStr = "did:key:" + tag;
            const did = CoreDID.parse(didStr);
            assert.deepStrictEqual(did.toString(), didStr);
            assert.deepStrictEqual(did.method(), "key");
            assert.deepStrictEqual(did.authority(), "key:" + tag);
            assert.deepStrictEqual(did.methodId(), tag);
            assert.deepStrictEqual(did.scheme(), "did");
        });
        it('example', () => {
            const tag = "123";
            const didStr = VALID_DID_EXAMPLE;
            const did = CoreDID.parse(didStr);
            assert.deepStrictEqual(did.toString(), didStr);
            assert.deepStrictEqual(did.method(), "example");
            assert.deepStrictEqual(did.authority(), "example:" + tag);
            assert.deepStrictEqual(did.methodId(), tag);
            assert.deepStrictEqual(did.scheme(), "did");
        });
    });
    describe('#setMethodId', function () {
        it('should work', () => {
            let didStr = "did:example:network:123";
            const did = CoreDID.parse(didStr);
            did.setMethodId("abc");
            assert.deepStrictEqual(did.toString(), "did:example:abc");
            assert.deepStrictEqual(did.method(), "example");
            assert.deepStrictEqual(did.authority(), "example:abc");
            assert.deepStrictEqual(did.methodId(), "abc");
        });
    });
    describe('#validMethodId', function () {
        it('should work', () => {
            // Valid
            assert.deepStrictEqual(CoreDID.validMethodId("abc"), true);
            assert.deepStrictEqual(CoreDID.validMethodId("network:123"), true);
            assert.deepStrictEqual(CoreDID.validMethodId("network:shard:123"), true);
            // Invalid
            assert.deepStrictEqual(CoreDID.validMethodId(" "), false);
            assert.deepStrictEqual(CoreDID.validMethodId("abc[brackets]"), false);
        });
    });
    describe('#setMethodName', function () {
        it('should work', () => {
            let didStr = "did:example:network:123";
            const did = CoreDID.parse(didStr);
            did.setMethodName("other");
            assert.deepStrictEqual(did.toString(), "did:other:network:123");
            assert.deepStrictEqual(did.method(), "other");
            assert.deepStrictEqual(did.authority(), "other:network:123");
            assert.deepStrictEqual(did.methodId(), "network:123");
        });
    });
    describe('#validMethodName', function () {
        it('should work', () => {
            // Valid
            assert.deepStrictEqual(CoreDID.validMethodId("abc"), true);
            assert.deepStrictEqual(CoreDID.validMethodId("example"), true);
            assert.deepStrictEqual(CoreDID.validMethodId("method123"), true);
            // Invalid
            assert.deepStrictEqual(CoreDID.validMethodId(" "), false);
            assert.deepStrictEqual(CoreDID.validMethodId("method[brackets]"), false);
        });
    });
});

describe('CoreDocument', function () {
    describe('#new', function () {
        it('minimal should work', () => {
            const doc = new CoreDocument({
                id: VALID_DID_EXAMPLE,
            });
            assert.deepStrictEqual(doc.id().toString(), VALID_DID_EXAMPLE);
            assert.deepStrictEqual(doc.controller(), []);
            assert.deepStrictEqual(doc.alsoKnownAs(), []);
            assert.deepStrictEqual(doc.verificatonMethod(), []);
            assert.deepStrictEqual(doc.assertionMethod(), []);
            assert.deepStrictEqual(doc.authentication(), []);
            assert.deepStrictEqual(doc.capabilityDelegation(), []);
            assert.deepStrictEqual(doc.capabilityInvocation(), []);
            assert.deepStrictEqual(doc.keyAgreement(), []);
            assert.deepStrictEqual(doc.methods(), []);
            assert.deepStrictEqual(doc.service(), []);
            assert.deepStrictEqual(doc.properties(), new Map());
        });
        it('full should work', () => {
            const did = CoreDID.parse(VALID_DID_EXAMPLE);
            const method0 = new CoreVerificationMethod(did, KeyType.Ed25519, KEY_BYTES, "key-0");
            const method1 = new CoreVerificationMethod(did, KeyType.Ed25519, KEY_BYTES, "key-1");
            const method2 = new CoreVerificationMethod(CoreDID.parse(VALID_DID_EXAMPLE), KeyType.Ed25519, KEY_BYTES, "key-2");
            const service = new CoreService({
                id: did.join('#service-1'),
                type: "LinkedDomains",
                serviceEndpoint: "https://example.com/",
            });

            const doc = new CoreDocument({
                id: VALID_DID_EXAMPLE,
                controller: [VALID_DID_KEY, VALID_DID_EXAMPLE],
                alsoKnownAs: [VALID_DID_KEY],
                verificationMethod: [method0, method1],
                assertionMethod: [method0.id()],
                authentication: [method2, method0.id()],
                keyAgreement: [method1.id()],
                capabilityDelegation: [method0.id(), method1.id()],
                capabilityInvocation: [method1.id(), method0.id()],
                service: [service],
                custom1: "asdf",
                custom2: 1234,
            });
            assert.deepStrictEqual(doc.id().toString(), did.toString());
            assert.deepStrictEqual(doc.controller().map((item: any) => item.toString()), [VALID_DID_KEY, VALID_DID_EXAMPLE]);
            assert.deepStrictEqual(doc.alsoKnownAs(), [VALID_DID_KEY]);
            assert.deepStrictEqual(doc.verificatonMethod().length, 2);
            assert.deepStrictEqual(doc.verificatonMethod()[0].toJSON(), method0.toJSON());
            assert.deepStrictEqual(doc.verificatonMethod()[1].toJSON(), method1.toJSON());
            assert.deepStrictEqual(doc.assertionMethod().length, 1);
            assert.deepStrictEqual(doc.assertionMethod()[0].toString(), method0.id().toString());
            assert.deepStrictEqual(doc.authentication().length, 2);
            assert.deepStrictEqual(doc.authentication()[0].toJSON(), method2.toJSON());
            assert.deepStrictEqual(doc.authentication()[1].toString(), method0.id().toString());
            assert.deepStrictEqual(doc.capabilityDelegation().length, 2);
            assert.deepStrictEqual(doc.capabilityDelegation()[0].toString(), method0.id().toString());
            assert.deepStrictEqual(doc.capabilityDelegation()[1].toString(), method1.id().toString());
            assert.deepStrictEqual(doc.capabilityInvocation().length, 2);
            assert.deepStrictEqual(doc.capabilityInvocation()[0].toString(), method1.id().toString());
            assert.deepStrictEqual(doc.capabilityInvocation()[1].toString(), method0.id().toString());
            assert.deepStrictEqual(doc.keyAgreement().length, 1);
            assert.deepStrictEqual(doc.keyAgreement()[0].toString(), method1.id().toString());
            assert.deepStrictEqual(doc.methods().length, 3);
            assert.deepStrictEqual(doc.methods()[0].toJSON(), method0.toJSON());
            assert.deepStrictEqual(doc.methods()[1].toJSON(), method1.toJSON());
            assert.deepStrictEqual(doc.methods()[2].toJSON(), method2.toJSON());
            assert.deepStrictEqual(doc.service().length, 1);
            assert.deepStrictEqual(doc.service()[0].toJSON(), service.toJSON());
            const properties = new Map()
            properties.set("custom1", "asdf");
            properties.set("custom2", 1234);
            assert.deepStrictEqual(doc.properties(), properties);
        });
    });
    describe('#insert/resolve/removeMethod', function () {
        it('should work', async () => {
            const doc = new CoreDocument({
                id: VALID_DID_EXAMPLE,
            });
            const fragment = "new-method-1";
            const scope = MethodScope.AssertionMethod();
            const method = new CoreVerificationMethod(doc.id(), KeyType.Ed25519, KEY_BYTES, fragment);

            // Add.
            doc.insertMethod(method, scope);
            // Resolve.
            const resolved = doc.resolveMethod(fragment, scope);
            assert.deepStrictEqual(resolved.id().fragment(), fragment);
            assert.deepStrictEqual(resolved.type().toString(), MethodType.Ed25519VerificationKey2018().toString());
            assert.deepStrictEqual(resolved.controller().toString(), doc.id().toString());
            assert.deepStrictEqual(resolved.data().tryDecode(), KEY_BYTES);
            assert.deepStrictEqual(resolved.toJSON(), method.toJSON());
            assert.deepStrictEqual(doc.resolveMethod(fragment, MethodScope.VerificationMethod()), undefined);
            // List.
            const list = doc.methods();
            assert.deepStrictEqual(list.length, 1);
            assert.deepStrictEqual(list[0].toJSON(), resolved.toJSON());
            // Remove.
            doc.removeMethod(resolved.id());
            assert.deepStrictEqual(doc.resolveMethod(fragment), undefined);
            assert.deepStrictEqual(doc.resolveMethod(fragment, scope), undefined);
            assert.deepStrictEqual(doc.resolveMethod(fragment, MethodScope.VerificationMethod()), undefined);
            assert.deepStrictEqual(doc.methods().length, 0);
        });
    });
    describe('#attach/detachMethodRelationship', function () {
        it('should work', async () => {
            const doc = new CoreDocument({
                id: VALID_DID_EXAMPLE,
            });
            const fragment = "new-method-1";
            const method = new CoreVerificationMethod(doc.id(), KeyType.Ed25519, KEY_BYTES, fragment);
            doc.insertMethod(method, MethodScope.VerificationMethod());
            assert.deepStrictEqual(doc.resolveMethod(fragment, MethodScope.VerificationMethod()).toJSON(), method.toJSON());

            // Attach.
            doc.attachMethodRelationship(method.id(), MethodRelationship.Authentication);
            assert.deepStrictEqual(doc.resolveMethod(fragment, MethodScope.VerificationMethod()).toJSON(), method.toJSON());
            assert.deepStrictEqual(doc.resolveMethod(fragment, MethodScope.Authentication()).toJSON(), method.toJSON());
            assert.deepStrictEqual(doc.resolveMethod(fragment, MethodScope.AssertionMethod()), undefined);
            assert.deepStrictEqual(doc.resolveMethod(fragment, MethodScope.CapabilityInvocation()), undefined);
            assert.deepStrictEqual(doc.resolveMethod(fragment, MethodScope.CapabilityDelegation()), undefined);
            assert.deepStrictEqual(doc.resolveMethod(fragment, MethodScope.KeyAgreement()), undefined);

            // Detach.
            doc.detachMethodRelationship(method.id(), MethodRelationship.Authentication);
            assert.deepStrictEqual(doc.resolveMethod(fragment, MethodScope.VerificationMethod()).toJSON(), method.toJSON());
            assert.deepStrictEqual(doc.resolveMethod(fragment, MethodScope.Authentication()), undefined);
            assert.deepStrictEqual(doc.resolveMethod(fragment, MethodScope.AssertionMethod()), undefined);
            assert.deepStrictEqual(doc.resolveMethod(fragment, MethodScope.CapabilityInvocation()), undefined);
            assert.deepStrictEqual(doc.resolveMethod(fragment, MethodScope.CapabilityDelegation()), undefined);
            assert.deepStrictEqual(doc.resolveMethod(fragment, MethodScope.KeyAgreement()), undefined);
        });
    });
    describe('#insert/resolve/removeService', function () {
        it('should work', async () => {
            const doc = new CoreDocument({
                id: VALID_DID_EXAMPLE,
            });
    
            // Add.
            const fragment1 = "new-service-1";
            const service = new CoreService({
                id: doc.id().toUrl().join('#' + fragment1),
                type: ["LinkedDomains", "ExampleType"],
                serviceEndpoint: ["https://example.com/", "https://iota.org/"],
            });
            doc.insertService(service);
            // Resolve.
            const resolved = doc.resolveService(fragment1);
            assert.deepStrictEqual(resolved.id().fragment(), fragment1);
            assert.deepStrictEqual(resolved.type(), ["LinkedDomains", "ExampleType"]);
            assert.deepStrictEqual(resolved.serviceEndpoint(), ["https://example.com/", "https://iota.org/"]);
            assert.deepStrictEqual(resolved.toJSON(), service.toJSON());
            // List.
            const list = doc.service();
            assert.deepStrictEqual(list.length, 1);
            assert.deepStrictEqual(list[0].toJSON(), resolved.toJSON());
            // Remove
            const remove = doc.removeService(resolved.id());
            assert.deepStrictEqual(remove, true);
            assert.deepStrictEqual(doc.resolveService(fragment1), undefined);
            assert.deepStrictEqual(doc.service().length, 0);
        });
    });
    describe('#properties', function () {
        it('should work', () => {
            const doc = new CoreDocument({
                id: VALID_DID_EXAMPLE,
            });
            assert.deepStrictEqual(doc.properties(), new Map());

            const properties = new Map()
            properties.set("custom1", "asdf");
            properties.set("custom2", 1234);
            doc.setPropertyUnchecked("custom1", "asdf");
            doc.setPropertyUnchecked("custom2", 1234);
            assert.deepStrictEqual(doc.properties(), properties);
        });
    });
});
