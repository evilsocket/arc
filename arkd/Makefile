.PHONY: build fmt lint run test vendor_clean vendor_get vendor_update vet

DEPENDENCIES=github.com/gin-gonic/gin \
			 github.com/dgrijalva/jwt-go \
			 github.com/gin-contrib/gzip \
			 github.com/gin-gonic/contrib/static \
			 github.com/gin-gonic/gin \
			 github.com/jinzhu/gorm
SRC_PATH=.
VENDOR_PATH=_vendor

TARGET=arkd
# Prepend our _vendor directory to the system GOPATH
# so that import path resolution will prioritize
# our third party snapshots.
GOPATH := ${PWD}/$(VENDOR_PATH):${GOPATH}
export GOPATH

default: build

build: vet
	go build -v $(FLAGS) -o $(TARGET) $(SRC_PATH)

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

vendor_update: vendor_get
	find $(VENDOR_PATH)/src -type d -name '.git' -o -name '.hg' -o -name '.bzr' -o -name '.svn' -exec rm -rf {} \;

# We have to set GOPATH to just the _vendor
# directory to ensure that `go get` doesn't
# update packages in our primary GOPATH instead.
# This will happen if you already have the package
# installed in GOPATH since `go get` will use
# that existing location as the destination.
vendor_get: vendor_clean
	GOPATH=${PWD}/$(VENDOR_PATH) go get -d -u -v $(DEPENDENCIES)

vendor_clean:
	rm -dRf $(VENDOR_PATH)/src
