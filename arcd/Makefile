.PHONY: build fmt lint run test dependencies_clean dependencies vet

DEPENDENCIES=github.com/gin-gonic/gin \
	     github.com/theckman/go-flock \
	     gopkg.in/gomail.v2 \
	     github.com/stretchr/testify/assert \
	     github.com/dgrijalva/jwt-go \
	     golang.org/x/crypto/...
SRC_PATH=.
DEPENDENCIES_PATH=_dependencies
TARGET=arcd

# Prepend our _dependancies directory to the system GOPATH so that import path
# resolution will prioritize our third party snapshots.
GOPATH := ${CURDIR}/$(DEPENDENCIES_PATH):${GOPATH}
export GOPATH

default: build

build: dependencies
	@go build $(FLAGS) -o $(TARGET) $(SRC_PATH)

# http://godoc.org/code.google.com/p/go.tools/cmd/vet
# go get code.google.com/p/go.tools/cmd/vet
vet:
	go vet $(SRC_PATH)

# http://golang.org/cmd/go/#hdr-Run_gofmt_on_package_sources
fmt:
	go fmt $(SRC_PATH)/...

# https://github.com/golang/lint
# go get github.com/golang/lint/golint
lint:
	golint $(SRC_PATH)

run: build
	clear
	@./$(TARGET)

test:
	go test $(SRC_PATH)/...

clean:
	rm -rf $(TARGET)

# We have to set GOPATH to just the _dependencies directory to ensure that `go
# get` doesn't update packages in our primary GOPATH instead.  This will happen
# if you already have the package installed in GOPATH since `go get` will use
# that existing location as the destination.
dependencies:
	GOPATH=${CURDIR}/$(DEPENDENCIES_PATH) go get -d -u -v $(DEPENDENCIES)

dependencies_clean:
	rm -dRf $(DEPENDENCIES_PATH)/src
