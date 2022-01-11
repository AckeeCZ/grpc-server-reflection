import t from 'tap'
import { GrpcCli, TestServer } from './grpc_cli.helpers'

t.before(() => {
  const server = new TestServer()
  t.context.server = server
  return server.start()
})
t.teardown(() => t.context.server.stop())

const LIST_SERVICES = `
routeguide.RouteGuide
`.trim()
t.test('list services', async () => {
  t.equal(await GrpcCli.run('ls', '', false), LIST_SERVICES.trim())
})

const LIST_METHODS = `
filename: proto/route_guide.proto
package: routeguide;
service RouteGuide {
  rpc GetFeature(routeguide.Point) returns (routeguide.Feature) {}
  rpc ListFeatures(routeguide.Rectangle) returns (stream routeguide.Feature) {}
  rpc RecordRoute(stream routeguide.Point) returns (routeguide.RouteSummary) {}
  rpc RouteChat(stream routeguide.RouteNote) returns (stream routeguide.RouteNote) {}
}
`.trim()
t.test('list methods', async () => {
  t.equal(await GrpcCli.run('ls', 'routeguide.RouteGuide', true), LIST_METHODS)
})

const METHOD_DETAIL = `
rpc ListFeatures(routeguide.Rectangle) returns (stream routeguide.Feature) {} 
`.trim()
t.test('method detail', async () => {
  t.equal(
    await GrpcCli.run('ls', 'routeguide.RouteGuide.ListFeatures', true),
    METHOD_DETAIL
  )
})

const MESSAGE_TYPE = `
message Point {
  int32 latitude = 1 [json_name = "latitude"];
  int32 longitude = 2 [json_name = "longitude"];
} 
`.trim()
t.test('method detail', async () => {
  t.equal(await GrpcCli.run('type', 'routeguide.Point', true), MESSAGE_TYPE)
})
