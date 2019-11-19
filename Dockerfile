FROM golang
ADD . /go/src/github.com/evilsocket/arc
WORKDIR /go/src/github.com/evilsocket/arc
COPY sample_config.json config.json
RUN make
EXPOSE 8443
ENTRYPOINT ./build/arc -config config.json