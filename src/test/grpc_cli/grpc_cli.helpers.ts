import { exec } from 'child_process'
import { Server, ServerCredentials } from '@grpc/grpc-js'
import { RouteGuideService } from '../../../dist/proto/route_guide_grpc_pb'
import { addReflection } from '../..'
import { join } from 'path'

export class TestServer {
  constructor(private server = new Server()) {}
  public start() {
    this.server.addService(RouteGuideService, {
      getFeature: () => {},
      listFeatures: () => {},
      recordRoute: () => {},
      routeChat: () => {},
    })
    addReflection(
      this.server,
      join(__dirname, '../../../dist/proto/route_guide.bin')
    )
    return new Promise<void>(resolve => {
      this.server.bindAsync(
        '0.0.0.0:50051',
        ServerCredentials.createInsecure(),
        () => {
          this.server.start()
          resolve()
        }
      )
    })
  }
  stop() {
    new Promise<void>((resolve, reject) =>
      this.server.tryShutdown(e => (e ? reject(e) : resolve()))
    )
  }
}

export class GrpcCli {
  public static run = async (
    command: 'ls' | 'type',
    argument: string,
    longListing: boolean
  ) => {
    const { stdout, stderr, exitCode } = await exec(
      `grpc_cli ${command} localhost:50051 ${argument} ${
        longListing ? '-l' : ''
      }`
    )
    if (exitCode !== 0) {
      throw new Error(await GrpcCli.streamToString(stderr))
    }
    return (await GrpcCli.streamToString(stdout)).trim()
  }

  private static streamToString = (s: any) =>
    new Promise<string>(resolve => {
      let acc = ''
      if (!s) return resolve(acc)
      s.on('data', (c: any) => (acc += c))
      s.on('end', () => resolve(acc))
    })
}
