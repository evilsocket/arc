FROM golang:1.22.2

ADD . /go/src/github.com/evilsocket/arc
WORKDIR /go/src/github.com/evilsocket/arc

RUN go build -o build/arc cmd/arc/*.go
EXPOSE 8443
EXPOSE 443
ENTRYPOINT ./build/arc -config /config.toml