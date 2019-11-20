/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package db

import (
	"encoding/json"
	"github.com/evilsocket/islazy/log"
	"github.com/theckman/go-flock"
	"io/ioutil"
	"path/filepath"
	"time"
)

type Meta struct {
	Id         uint64    `json:"id"`
	Title      string    `json:"title"`
	Encryption string    `json:"encryption"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
	ExpiredAt  time.Time `json:"expired_at"`
	Prune      bool      `json:"prune"`
	Notified   bool      `json:"notified"`
	Compressed bool      `json:"compressed"`
	Pinned     bool      `json:"pinned"`
	Size       uint64    `json:"size"`
	NextId     uint64    `json:"next_id"`

	path string
	lock *flock.Flock
}

func (m *Meta) Lock() error {
	return m.lock.Lock()
}

func (m *Meta) Unlock() error {
	return m.lock.Unlock()
}

func (m *Meta) FlushNoLock() error {
	log.Debug("Flushing meta file '%s'.", m.path)

	buff, err := json.Marshal(m)
	if err != nil {
		log.Error("Error while serializing meta file: %s", err)
		return err
	}

	if err = ioutil.WriteFile(m.path, buff, 0644); err != nil {
		log.Error("Error while writing meta file to %s: %s", m.path, err)
		return err
	}

	return nil
}

func (m *Meta) Flush() error {
	m.Lock()
	defer m.Unlock()
	return m.FlushNoLock()
}

func (m *Meta) Update(values *Meta) (err error) {
	m.Lock()
	defer m.Unlock()

	m.Title = values.Title
	m.Encryption = values.Encryption
	m.UpdatedAt = time.Now()
	m.ExpiredAt = values.ExpiredAt
	m.Prune = values.Prune
	m.Compressed = values.Compressed
	m.Pinned = values.Pinned
	m.Size = values.Size

	return m.FlushNoLock()
}

func (m *Meta) Close() {
	if err := m.Flush(); err != nil {
		log.Error("Error while flushing meta file '%s': %s", m.path, err)
	}
}

func (m *Meta) SetPath(path string) error {
	m.path = path
	m.lock = flock.NewFlock(filepath.Join(path, ".lock"))
	return nil
}

func CreateMeta(path string, values *Meta) (meta *Meta, err error) {
	meta = &Meta{
		Id:         values.Id,
		Title:      values.Title,
		Encryption: values.Encryption,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
		ExpiredAt:  values.ExpiredAt,
		Prune:      values.Prune,
		Compressed: values.Compressed,
		Size:       values.Size,
		Pinned:     false,
		Notified:   false,
		NextId:     1,
	}

	if err = meta.SetPath(path); err != nil {
		log.Error("Error setting path %s: %s", path, err)
		return nil, err
	} else if err = meta.Flush(); err != nil {
		log.Error("Error flushing meta file: %s", err)
		return nil, err
	}

	return meta, nil
}

func OpenMeta(path string) (meta *Meta, err error) {
	log.Debug("Opening meta from '%s' ...", path)

	buff, err := ioutil.ReadFile(path)
	if err != nil {
		log.Error("Error opening %s: %s", path, err)
		return nil, err
	}

	var m Meta
	if err = json.Unmarshal(buff, &m); err != nil {
		log.Error("Error while parsing json from buffer '%s': %s", string(buff), err)
		return nil, err
	}

	m.SetPath(path)
	meta = &m

	// log.Debug("%+v", meta)

	return meta, nil
}
