# ⚠️ grpc-server-reflection

---

> **⚠️ This repository is no longer maintained and has been archived for reference purposes.**

### 📌 Important Notes:
- **🚫 No further updates** will be made.
- **🛑 Issues and pull requests** are no longer monitored.
- **⚠️ Use at your own risk** as the code may not meet current standards or may contain vulnerabilities.

For continued use, please **consider forking this repository**.

🙏 Thank you for your interest in this project!

---

gRPC [server reflection](https://github.com/grpc/grpc/blob/master/doc/server-reflection.md) for Node.js.


Using the reflection on your server allows your clients to get information regarding available RPCs and their format without actually having the schema definition.

With reflection you can use tools like [grpcurl](https://github.com/fullstorydev/grpcurl) or [wombat](https://github.com/rogchap/wombat) to call and test the API without linking the schema files, but just by accessing the live server.

[![](https://flat.badgen.net/npm/v/grpc-server-reflection)](https://www.npmjs.com/package/grpc-server-reflection)
[![](https://flat.badgen.net/github/license/ackeecz/grpc-server-reflection)](https://github.com/ackeecz/grpc-server-reflection/blob/master/LICENSE)

## Usage

The package adds a defined reflection service implementation to your server. The data about your schema is read from a descriptor set, which you can produce with your code generator.

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

## Notes

- Reflection can be added before or after registering other services
- All services from descriptor set are available
- Server reflection service is not included (unless added manually in the descriptor set)
- Running tests requires [`grpc_cli`](https://github.com/grpc/grpc/blob/master/doc/command_line_tool.md)

## Thanks

This project is heavily inspired and ports some parts of code from [`nice-grpc-server-reflection`](https://www.npmjs.com/package/nice-grpc-server-reflection). I respectfully burrowed some of the code based on [encouragement](https://github.com/grpc/grpc-node/issues/79#issuecomment-873360048) from the author, to available solid server reflection for Node.js for general purpose. I tried to implement it myself but failed due to some incompatibilities with binary format in `protobuf-js` with the C++ implementation. Using descriptor sets avoids as in the referenced project avoids the issues.

## See also

Here is a list and comparison with the similar projects:

| package                                                                                    | full support | `@grpc/grpc-js` support | `grpc` support | framework agnostic | service detection |
| ------------------------------------------------------------------------------------------ | ------------ | ----------------------- | -------------- | ------------------ | ----------------- |
| [`grpc-server-reflection`](https://www.npmjs.com/package/grpc-server-reflection)           | ✅️           | ✅️                      | ✅️             | ✅️                 | ✅️                |
| [`nice-grpc-server-reflection`](https://www.npmjs.com/package/nice-grpc-server-reflection) | ✅️           | ✅️                      | ❌             | ❌                 | ❌                |
| [`grpc-node-server-reflection`](https://www.npmjs.com/package/grpc-node-server-reflection) | ❌           | ✅️                      | ❌             | ❌                 | ❌                |
| [`grpc-reflection-js`](https://www.npmjs.com/package/grpc-reflection-js)                   | ❌           | ✅️                      | ❌             | ❌                 | ❌                |


## License

MIT
