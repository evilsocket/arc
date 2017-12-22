.PHONY: build fmt lint run test vet deps install

PREFIX_DIR=/usr/local
BIN_DIR=$(PREFIX_DIR)/bin
CONFIG_DIR=$(PREFIX_DIR)/etc
WEBAPP_DIR=$(PREFIX_DIR)/share
SERVICE_DIR=/lib/systemd/system
SERVICE_LN_DIR=/etc/systemd/system

default: build

build: deps fmt lint build_arcd build_arc_decrypt


build_arcd:
	@go build $(FLAGS) -o arcd ./cmd/arcd/

build_arc_decrypt:
	@go build $(FLAGS) -o arc_decrypt ./cmd/arc_decrypt/

fmt:
	@go fmt ./...

lint:
	@golint .

test:
	@go test ./...

clean:
	@rm -rf arcd arc_decrypt

deps:
	@go get github.com/gin-gonic/gin
	@go get github.com/theckman/go-flock
	@go get gopkg.in/gomail.v2 
	@go get github.com/stretchr/testify/assert
	@go get github.com/dgrijalva/jwt-go 
	@go get golang.org/x/crypto/...
	@go get golang.org/x/crypto/openpgp

# runs on previlege
install: build
	@echo "Installing arcd in $(PREFIX_DIR)" 
	@install -D -m 744 (SRC_PATH)/arcd $(BIN_DIR)/arcd
	@setcap 'cap_net_bind_service=+ep' $(BIN_DIR)/arcd
	@echo "Installing arc_decrypt in $(PREFIX_DIR)" 
	@install -D -m 744 (SRC_PATH)/arc_decrypt $(BIN_DIR)/arc_decrypt
	@cp -r ../arc $(WEBAPP_DIR)/arc
	@install -D -m 644 ./sample_config.json $(CONFIG_DIR)/arcd/config.json
	@install -D -m 644 ./arcd@.service $(SERVICE_DIR)/arcd@.service
	@ln -s $(SERVICE_DIR)/arcd@.service $(SERVICE_LN_DIR)/arcd@.service || echo "symlink already exists...skipping"
	@echo "Done."
