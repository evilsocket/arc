FROM golang:1.22.2

ADD . /go/src/github.com/evilsocket/arc
WORKDIR /go/src/github.com/evilsocket/arc
COPY sample_config.toml config.toml

RUN go build -o build/arc cmd/arc/*.go
EXPOSE 8443
ENTRYPOINT ./build/arc -config config.toml