FROM golang
ADD . /go/src/github.com/evilsocket/arc
RUN go get -u github.com/gin-gonic/gin
RUN ln -s /go/src/github.com/gin-gonic/gin/internal/json/ /go/src/github.com/gin-gonic/gin/json
WORKDIR /go/src/github.com/evilsocket/arc/arcd
COPY arcd/sample_config.json config.json
RUN make
EXPOSE 8443
ENTRYPOINT ./arcd -config config.json -app ../arc
