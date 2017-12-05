TARGET=vaultd

all: build
	@echo "@ Done"
	@ls -la $(TARGET)
	@echo -n "\n"

build:
	@echo "@ Building $(TARGET) ..."
	@go build $(FLAGS) -o $(TARGET) .

clean:
	@rm -rf $(TARGET)
