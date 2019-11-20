.PHONY: build test install

SRC_PATH=cmd/arc/*.go
TARGET=arc
PREFIX_DIR=/usr/local
BIN_DIR=$(PREFIX_DIR)/bin
CONFIG_DIR=$(PREFIX_DIR)/etc
SERVICE_DIR=/lib/systemd/system
SERVICE_LN_DIR=/etc/systemd/system

all: build

build: assets
	@mkdir -p build
	@go build $(FLAGS) -o build/$(TARGET) $(SRC_PATH)

assets: bindata
	@rm -rf webui/compiled.go
	@go-bindata -o webui/compiled.go -pkg webui webui/...

bindata:
	@go get -u github.com/jteeuwen/go-bindata/...

test:
	@go test ./...

clean:
	@rm -rf build

install:
	@service arc stop
	@cp build/$(TARGET) /usr/local/bin/
	@setcap 'cap_net_bind_service=+ep' /usr/local/bin/$(TARGET)
	@mkdir -p /usr/local/etc/$(TARGET)
	@test -s /usr/local/etc/$(TARGET)/config.json || { cp sample_config.json /usr/local/etc/$(TARGET)/config.json; }
	@cp arc.service /etc/systemd/system/
	@systemctl daemon-reload
	@systemctl enable arc
	@service arc restart
