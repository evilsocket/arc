FROM golang
ADD . /go/src/github.com/evilsocket/arc
WORKDIR /go/src/github.com/evilsocket/arc
COPY sample_config.toml config.toml
RUN make build
EXPOSE 8443
ENTRYPOINT ./build/arc -config config.toml