# grpc-server-reflection

gRPC server reflection for [`@grpc/grpc-js`](https://www.npmjs.com/package/@grpc/grpc-js)

## Usage
### Generate descriptor set
Generate descriptor set with `grpc_tools_node_protoc` using `descriptor_set_out` and `include_imports`, e.g.:
```
grpc_tools_node_protoc
    --descriptor_set_out=path/to/descriptor_set.bin
    --include_imports
    ./api/**/*.proto
```

### Add reflection
```ts
import { Server } from '@grpc/grpc-js';
import { addReflection } from 'grpc-server-reflection'

const server = new Server()
addReflection(server, 'path/to/descriptor_set.bin')
```

## Thanks

This project is heavily inspired and ports some parts of code from [`grpc-server-reflection`](https://www.npmjs.com/package/grpc-server-reflection). I respectfully burrowed some of the code based on [encouragement](https://github.com/grpc/grpc-node/issues/79#issuecomment-873360048) from the author, to available solid server reflection for Node.js for general purpose. I tried to implement it myself but failed due to some incompatibilities with binary format in `protobuf-js` with the C++ implementation. Using descriptor sets avoids as in the referenced project avoids the issues.

## See also

Here is a list and comparison with the similar projects:

| package                                                                                    | full support | `@grpc/grpc-js` support | `grpc` support | framework agnostic | service detection |
| ------------------------------------------------------------------------------------------ | ------------ | ----------------------- | -------------- | ------------------ | ----------------- |
| [`grpc-server-reflection`](https://www.npmjs.com/package/grpc-server-reflection)           | ✔️           | ✔️                      | ✔️             | ✔️                 | ✔️                |
| [`nice-grpc-server-reflection`](https://www.npmjs.com/package/nice-grpc-server-reflection) | ✔️           | ✔️                      | ❌             | ❌                 | ❌                |
| [`grpc-node-server-reflection`](https://www.npmjs.com/package/grpc-node-server-reflection) | ❌           | ✔️                      | ❌             | ❌                 | ❌                |
| [`grpc-reflection-js`](https://www.npmjs.com/package/grpc-reflection-js)                   | ❌           | ✔️                      | ❌             | ❌                 | ❌                |
