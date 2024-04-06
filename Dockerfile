FROM golang:1.22.2

ADD . /go/src/github.com/evilsocket/arc
WORKDIR /go/src/github.com/evilsocket/arc

RUN go build -o /bin/arc cmd/arc/*.go
EXPOSE 8443
EXPOSE 443
ENTRYPOINT ["/bin/arc"]