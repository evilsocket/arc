FROM golang
ADD . /go/src/github.com/evilsocket/arc
WORKDIR /go/src/github.com/evilsocket/arc/arcd
COPY arcd/sample_config.json config.json
RUN make
EXPOSE 8080
ENTRYPOINT ./arcd -config config.json -app ../arc
