import {
  DescriptorProto,
  EnumDescriptorProto,
  FileDescriptorProto,
  FileDescriptorSet,
  MethodDescriptorProto,
  ServiceDescriptorProto,
} from 'google-protobuf/google/protobuf/descriptor_pb'
import {
  IServerReflectionServer,
  ServerReflectionService,
} from '../dist/proto/reflection_grpc_pb'
import {
  ErrorResponse,
  ExtensionNumberResponse,
  FileDescriptorResponse,
  ListServiceResponse,
  ServerReflectionRequest,
  ServerReflectionResponse,
  ServiceResponse,
} from '../dist/proto/reflection_pb'
import { readFileSync } from 'fs'

class ReflectionHandler {
  private fileDescriptorSet: FileDescriptorSet
  constructor(fileDescriptorSetPath: string) {
    this.fileDescriptorSet = FileDescriptorSet.deserializeBinary(
      readFileSync(fileDescriptorSetPath)
    )
  }

  public fileBySymbol(symbol: string) {
    const fileDescriptorProto = this.fileDescriptorSet
      .getFileList()
      .find(file => this.findSymbol(symbol, file) != null)

    return fileDescriptorProto
  }

  public fileByName(filename: string) {
    const fileDescriptorProto = this.fileDescriptorSet
      .getFileList()
      .find(file => file.getName() === filename)

    return fileDescriptorProto
  }

  public fileContainingExtension(
    containingType: string,
    extensionNumber: number
  ) {
    return this.fileDescriptorSet.getFileList().find(file => {
      const descriptor = this.findSymbol(containingType, file)

      return (
        descriptor instanceof DescriptorProto &&
        descriptor
          .getExtensionList()
          .some(extension => extensionNumber === extension.getNumber())
      )
    })
  }

  public getServiceNames() {
    return this.fileDescriptorSet.getFileList().flatMap(files => {
      const packageName = files.getPackage()
      return files
        .getServiceList()
        .flatMap(service => `${packageName}.${service.getName()}`)
    })
  }

  private findSymbol(
    symbol: string,
    descriptor:
      | FileDescriptorProto
      | DescriptorProto
      | EnumDescriptorProto
      | ServiceDescriptorProto
      | MethodDescriptorProto,
    prefix: string = ''
  ):
    | DescriptorProto
    | EnumDescriptorProto
    | ServiceDescriptorProto
    | MethodDescriptorProto
    | undefined {
    if (descriptor instanceof FileDescriptorProto) {
      const packageName = descriptor.getPackage()

      const packagePrefix = !packageName ? '' : `${packageName}.`

      return (
        descriptor
          .getMessageTypeList()
          .find(type => this.findSymbol(symbol, type, packagePrefix)) ||
        descriptor
          .getEnumTypeList()
          .find(type => this.findSymbol(symbol, type, packagePrefix)) ||
        descriptor
          .getServiceList()
          .find(type => this.findSymbol(symbol, type, packagePrefix))
      )
    }

    const fullName = prefix + descriptor.getName()

    if (symbol === fullName) {
      return descriptor
    }

    if (descriptor instanceof DescriptorProto) {
      const messagePrefix = `${fullName}.`

      return (
        descriptor
          .getNestedTypeList()
          .find(type => this.findSymbol(symbol, type, messagePrefix)) ||
        descriptor
          .getEnumTypeList()
          .find(type => this.findSymbol(symbol, type, messagePrefix))
      )
    }

    if (descriptor instanceof ServiceDescriptorProto) {
      const servicePrefix = `${fullName}.`

      return descriptor
        .getMethodList()
        .find(method => this.findSymbol(symbol, method, servicePrefix))
    }

    return undefined
  }
}

const notFoundError = (
  type: 'File' | 'Symbol' | 'Extension',
  requested: string
) =>
  new ServerReflectionResponse().setErrorResponse(
    new ErrorResponse()
      .setErrorCode(5 /*Status.NOT_FOUND*/)
      .setErrorMessage(`${type} not found: ${requested}`)
  )

const NOT_IMPLEMENTED_CALL_ERROR =
  new ServerReflectionResponse().setErrorResponse(
    new ErrorResponse()
      .setErrorCode(12 /*Status.UNIMPLEMENTED*/)
      .setErrorMessage('Not implemented')
  )


type ServerLike = { addService: (service: any, implementation: any) => any }
export const addReflection = (
  server: ServerLike,
  fileDescriptorSetPath: string
) => {
  const reflectionHandler = new ReflectionHandler(fileDescriptorSetPath)
  const serviceNames = reflectionHandler.getServiceNames()

  const handleRequest = (request: ServerReflectionRequest) => {
    switch (request.getMessageRequestCase()) {
      case ServerReflectionRequest.MessageRequestCase.FILE_BY_FILENAME: {
        const filename = request.getFileByFilename()
        const fileDescriptor = reflectionHandler.fileByName(filename)
        if (!fileDescriptor) {
          return notFoundError('File', filename)
        }
        return new ServerReflectionResponse()
          .setOriginalRequest(request)
          .setFileDescriptorResponse(
            new FileDescriptorResponse().setFileDescriptorProtoList([
              fileDescriptor.serializeBinary(),
            ])
          )
      }
      case ServerReflectionRequest.MessageRequestCase.FILE_CONTAINING_SYMBOL: {
        const symbol = request.getFileContainingSymbol()
        const fileDescriptor = reflectionHandler.fileBySymbol(symbol)
        if (!fileDescriptor) {
          return notFoundError('Symbol', symbol)
        }

        return new ServerReflectionResponse()
          .setOriginalRequest(request)
          .setFileDescriptorResponse(
            new FileDescriptorResponse().setFileDescriptorProtoList([
              fileDescriptor.serializeBinary(),
            ])
          )
      }
      case ServerReflectionRequest.MessageRequestCase
        .FILE_CONTAINING_EXTENSION: {
        const extensionRequest = request.getFileContainingExtension()!
        const containingType = extensionRequest.getContainingType()
        const extensionNumber = extensionRequest.getExtensionNumber()

        const fileDescriptor = reflectionHandler.fileContainingExtension(
          containingType,
          extensionNumber
        )

        if (!fileDescriptor) {
          return notFoundError(
            'Extension',
            `${containingType}(${extensionNumber})`
          )
        }

        return new ServerReflectionResponse()
          .setOriginalRequest(request)
          .setFileDescriptorResponse(
            new FileDescriptorResponse().setFileDescriptorProtoList([
              fileDescriptor.serializeBinary(),
            ])
          )
      }
      case ServerReflectionRequest.MessageRequestCase.LIST_SERVICES: {
        return new ServerReflectionResponse()
          .setOriginalRequest(request)
          .setListServicesResponse(
            new ListServiceResponse().setServiceList(
              serviceNames.map(serviceName =>
                new ServiceResponse().setName(serviceName)
              )
            )
          )
      }
      case ServerReflectionRequest.MessageRequestCase
        .ALL_EXTENSION_NUMBERS_OF_TYPE: {
        const type = request.getAllExtensionNumbersOfType()
        return new ServerReflectionResponse().setAllExtensionNumbersResponse(
          new ExtensionNumberResponse().setBaseTypeName(type)
        )
      }
    }
    return NOT_IMPLEMENTED_CALL_ERROR
  }
  const reflectionImplementation: IServerReflectionServer = {
    serverReflectionInfo: call => {
      call.on('data', (request: ServerReflectionRequest) => {
        try {
          call.write(handleRequest(request))
        } catch (e) {
          console.error(e)
          call.end()
        }
      })
      call.on('end', () => {
        call.end()
      })
    },
  }
  server.addService(ServerReflectionService, reflectionImplementation)
}
